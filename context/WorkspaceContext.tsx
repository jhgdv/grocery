import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { friendlyError } from "../lib/design";
import { createLocalWorkspaceId, PERSONAL_WORKSPACE_ID, workspaceStorageKey } from "../lib/workspaceFallback";

const ACTIVE_WORKSPACE_KEY = "active_workspace_id";

export type Workspace = {
  id: string;
  name: string;
  created_by: string;
  created_at?: string;
  fallback?: boolean;
};

export type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  invited_email: string;
  status: "pending" | "accepted" | "declined";
  invited_by?: string | null;
  workspaces?: { name: string } | null;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  invites: WorkspaceInvite[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  loading: boolean;
  schemaReady: boolean;
  setActiveWorkspace: (workspaceId: string) => Promise<void>;
  refresh: () => Promise<void>;
  createWorkspace: (name: string) => Promise<{ data: Workspace | null; error: string | null }>;
  inviteToWorkspace: (workspaceId: string, email: string) => Promise<{ error: string | null }>;
  respondToInvite: (inviteId: string, status: "accepted" | "declined") => Promise<{ error: string | null }>;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  invites: [],
  activeWorkspaceId: null,
  activeWorkspace: null,
  loading: true,
  schemaReady: false,
  setActiveWorkspace: async () => {},
  refresh: async () => {},
  createWorkspace: async () => ({ data: null, error: "not initialized" }),
  inviteToWorkspace: async () => ({ error: "not initialized" }),
  respondToInvite: async () => ({ error: "not initialized" }),
});

function tableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || error.code === "PGRST204" || error.code === "42P01";
}

function isSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code || "") : "";
  const message = "message" in error ? String((error as { message?: string }).message || "").toLowerCase() : "";
  return (
    code === "PGRST205" ||
    code === "PGRST204" ||
    code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

function normalizeLocalWorkspaces(userId: string, input: unknown): Workspace[] {
  const personal: Workspace = {
    id: PERSONAL_WORKSPACE_ID,
    name: "Personal",
    created_by: userId,
    created_at: new Date().toISOString(),
    fallback: true,
  };

  if (!Array.isArray(input)) return [personal];

  const sanitized = input
    .filter((item): item is Workspace => !!item && typeof item === "object")
    .map((item: any) => ({
      id: typeof item.id === "string" ? item.id : createLocalWorkspaceId(),
      name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : "Workspace",
      created_by: typeof item.created_by === "string" ? item.created_by : userId,
      created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
      fallback: true,
    }))
    .filter((workspace) => workspace.id !== PERSONAL_WORKSPACE_ID);

  return [personal, ...sanitized];
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);

  const persistActiveWorkspace = async (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    await AsyncStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
  };

  const setActiveWorkspace = async (workspaceId: string) => {
    await persistActiveWorkspace(workspaceId);
  };

  const loadLocalFallback = async (userId: string) => {
    const raw = await AsyncStorage.getItem(workspaceStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    const localWorkspaces = normalizeLocalWorkspaces(userId, parsed);

    setInvites([]);
    setWorkspaces(localWorkspaces);

    const savedWorkspaceId = await AsyncStorage.getItem(ACTIVE_WORKSPACE_KEY);
    const active = localWorkspaces.some((workspace) => workspace.id === savedWorkspaceId)
      ? (savedWorkspaceId as string)
      : PERSONAL_WORKSPACE_ID;

    await persistActiveWorkspace(active);
  };

  const saveLocalWorkspaces = async (userId: string, next: Workspace[]) => {
    const withoutPersonal = next.filter((workspace) => workspace.id !== PERSONAL_WORKSPACE_ID);
    await AsyncStorage.setItem(workspaceStorageKey(userId), JSON.stringify(withoutPersonal));
  };

  const refresh = async () => {
    if (!user) {
      setWorkspaces([]);
      setInvites([]);
      setActiveWorkspaceId(null);
      setSchemaReady(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    const email = user.email?.toLowerCase();

    try {
      const [ownedWorkspacesRes, memberRes, inviteRes] = await Promise.all([
        supabase.from("workspaces").select("id,name,created_by,created_at").eq("created_by", user.id),
        supabase
          .from("workspace_members")
          .select("workspace_id, workspaces(id,name,created_by,created_at)")
          .eq("invited_email", email)
          .eq("status", "accepted"),
        supabase
          .from("workspace_members")
          .select("id,workspace_id,invited_email,status,invited_by,workspaces(name)")
          .eq("invited_email", email)
          .eq("status", "pending"),
      ]);

      const missingSchema =
        tableMissing(ownedWorkspacesRes.error) ||
        tableMissing(memberRes.error) ||
        tableMissing(inviteRes.error);

      if (missingSchema) {
        setSchemaReady(false);
        await loadLocalFallback(user.id);
        return;
      }

      if (ownedWorkspacesRes.error) throw ownedWorkspacesRes.error;
      if (memberRes.error) throw memberRes.error;
      if (inviteRes.error) throw inviteRes.error;

      setSchemaReady(true);

      const owned = (ownedWorkspacesRes.data || []) as Workspace[];
      const member = ((memberRes.data || []) as any[])
        .map((row) => row.workspaces)
        .filter(Boolean) as Workspace[];
      const merged = Array.from(new Map([...owned, ...member].map((workspace) => [workspace.id, workspace])).values());

      let next = merged;

      if (next.length === 0) {
        const createRes = await supabase
          .from("workspaces")
          .insert([{ name: "Shared Home", created_by: user.id }])
          .select("id,name,created_by,created_at")
          .single();

        if (createRes.error) throw createRes.error;

        const created = createRes.data as Workspace;
        next = [created];

        await supabase.from("workspace_members").upsert([
          {
            workspace_id: created.id,
            invited_email: email,
            user_id: user.id,
            invited_by: user.id,
            role: "owner",
            status: "accepted",
          },
        ]);
      }

      next.sort((a, b) => {
        if (a.created_by === user.id && b.created_by !== user.id) return -1;
        if (a.created_by !== user.id && b.created_by === user.id) return 1;
        return a.name.localeCompare(b.name);
      });

      setWorkspaces(next);
      const normalizedInvites = ((inviteRes.data || []) as any[]).map((invite) => ({
        ...invite,
        workspaces: Array.isArray(invite.workspaces) ? invite.workspaces[0] || null : invite.workspaces || null,
      }));
      setInvites(normalizedInvites as WorkspaceInvite[]);

      const savedWorkspaceId = await AsyncStorage.getItem(ACTIVE_WORKSPACE_KEY);
      const hasSaved = savedWorkspaceId && next.some((workspace) => workspace.id === savedWorkspaceId);
      const firstWorkspaceId = next[0]?.id || null;
      const preferredWorkspaceId = hasSaved ? savedWorkspaceId : firstWorkspaceId;

      if (preferredWorkspaceId) {
        await persistActiveWorkspace(preferredWorkspaceId);
      } else {
        setActiveWorkspaceId(null);
      }
    } catch (error) {
      console.log("Workspace refresh error", error);
      setSchemaReady(false);
      await loadLocalFallback(user.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id, user?.email]);

  const createWorkspace: WorkspaceContextType["createWorkspace"] = async (name) => {
    if (!user) return { data: null, error: "You are not signed in." };

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { data: null, error: "Workspace name is required." };
    }

    if (!schemaReady) {
      const duplicate = workspaces.some((workspace) => workspace.name.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) return { data: null, error: "A workspace with this name already exists." };

      const created: Workspace = {
        id: createLocalWorkspaceId(),
        name: trimmedName,
        created_by: user.id,
        created_at: new Date().toISOString(),
        fallback: true,
      };

      const next = [...workspaces, created].sort((a, b) => a.name.localeCompare(b.name));
      setWorkspaces(next);
      await saveLocalWorkspaces(user.id, next);
      await persistActiveWorkspace(created.id);
      return { data: created, error: null };
    }

    try {
      const createRes = await supabase
        .from("workspaces")
        .insert([{ name: trimmedName, created_by: user.id }])
        .select("id,name,created_by,created_at")
        .single();

      if (createRes.error) throw createRes.error;

      const created = createRes.data as Workspace;

      const memberRes = await supabase.from("workspace_members").upsert([
        {
          workspace_id: created.id,
          invited_email: user.email?.toLowerCase(),
          user_id: user.id,
          invited_by: user.id,
          role: "owner",
          status: "accepted",
        },
      ]);

      if (memberRes.error) throw memberRes.error;

      await refresh();
      await persistActiveWorkspace(created.id);

      return { data: created, error: null };
    } catch (error) {
      if (isSchemaMissingError(error)) {
        setSchemaReady(false);
        await loadLocalFallback(user.id);
        return createWorkspace(trimmedName);
      }
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
        return { data: null, error: "A workspace with this name already exists." };
      }
      return { data: null, error: friendlyError(error) };
    }
  };

  const inviteToWorkspace: WorkspaceContextType["inviteToWorkspace"] = async (workspaceId, email) => {
    if (!user) return { error: "You are not signed in." };

    if (!schemaReady) {
      return { error: "Workspace-wide invites require Supabase workspace tables. You can still share individual lists." };
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        return { error: "Enter a valid email address." };
      }

      const insertRes = await supabase.from("workspace_members").upsert([
        {
          workspace_id: workspaceId,
          invited_email: normalizedEmail,
          invited_by: user.id,
          status: "pending",
          role: "member",
        },
      ]);

      if (insertRes.error) throw insertRes.error;

      await refresh();
      return { error: null };
    } catch (error) {
      if (isSchemaMissingError(error)) {
        return { error: "Run the workspace SQL script in Supabase first." };
      }
      return { error: friendlyError(error) };
    }
  };

  const respondToInvite: WorkspaceContextType["respondToInvite"] = async (inviteId, status) => {
    if (!user) return { error: "You are not signed in." };

    if (!schemaReady) {
      return { error: "Workspace invites require Supabase workspace tables." };
    }

    try {
      if (status === "declined") {
        const declineRes = await supabase.from("workspace_members").delete().eq("id", inviteId);
        if (declineRes.error) throw declineRes.error;
      } else {
        const acceptRes = await supabase
          .from("workspace_members")
          .update({ status: "accepted", user_id: user.id })
          .eq("id", inviteId);

        if (acceptRes.error) throw acceptRes.error;
      }

      await refresh();
      return { error: null };
    } catch (error) {
      if (isSchemaMissingError(error)) {
        return { error: "Run the workspace SQL script in Supabase first." };
      }
      return { error: friendlyError(error) };
    }
  };

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

  const value = useMemo(
    () => ({
      workspaces,
      invites,
      activeWorkspaceId,
      activeWorkspace,
      loading,
      schemaReady,
      setActiveWorkspace,
      refresh,
      createWorkspace,
      inviteToWorkspace,
      respondToInvite,
    }),
    [workspaces, invites, activeWorkspaceId, activeWorkspace, loading, schemaReady]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
