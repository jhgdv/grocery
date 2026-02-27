import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { supabase } from "../lib/supabase";
import { fonts, getFirstName, palette, safeIconName, typeStyles } from "../lib/design";
import { Logo } from "./Logo";

type ListRow = {
  id: string;
  name: string;
  icon?: string | null;
  created_at?: string;
  workspace_id?: string | null;
};

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { workspaces, activeWorkspaceId, setActiveWorkspace, schemaReady, createWorkspace } = useWorkspace();

  const [listsByWorkspace, setListsByWorkspace] = useState<Record<string, ListRow[]>>({});
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!user) {
      setListsByWorkspace({});
      return;
    }

    setIsLoadingLists(true);

    try {
      if (!schemaReady) {
        const [ownedRes, sharedRes] = await Promise.all([
          supabase.from("lists").select("id,name,icon,created_at,workspace_id").eq("user_id", user.id),
          supabase
            .from("list_shares")
            .select("list_id, lists(id,name,icon,created_at,workspace_id)")
            .eq("invited_email", user.email?.toLowerCase())
            .eq("status", "accepted"),
        ]);

        if (!ownedRes.error) {
          const shared = ((sharedRes.data || []) as any[]).map((row) => row.lists).filter(Boolean);
          const merged = Array.from(new Map([...(ownedRes.data || []), ...shared].map((row: any) => [row.id, row])).values()) as ListRow[];
          const sorted = merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setListsByWorkspace({ personal: sorted });
        }

        return;
      }

      const workspaceIds = workspaces.map((workspace) => workspace.id);
      if (workspaceIds.length === 0) {
        setListsByWorkspace({});
        return;
      }

      const listsRes = await supabase
        .from("lists")
        .select("id,name,icon,created_at,workspace_id")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: false });

      if (listsRes.error) {
        console.log("Sidebar list fetch error", listsRes.error);
        return;
      }

      const grouped: Record<string, ListRow[]> = {};
      for (const workspaceId of workspaceIds) grouped[workspaceId] = [];

      for (const list of (listsRes.data || []) as ListRow[]) {
        const key = list.workspace_id || activeWorkspaceId || "personal";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(list);
      }

      setListsByWorkspace(grouped);
    } finally {
      setIsLoadingLists(false);
    }
  }, [user?.id, user?.email, workspaces, schemaReady, activeWorkspaceId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists, pathname]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("sidebar-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "lists" }, fetchLists)
      .on("postgres_changes", { event: "*", schema: "public", table: "list_shares" }, fetchLists)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_members" }, fetchLists)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchLists]);

  const orderedWorkspaces = useMemo(
    () => [...workspaces].sort((a, b) => (a.id === activeWorkspaceId ? -1 : b.id === activeWorkspaceId ? 1 : a.name.localeCompare(b.name))),
    [workspaces, activeWorkspaceId]
  );

  const handleCreateWorkspace = async () => {
    const trimmed = workspaceName.trim();
    if (!trimmed) return;

    setIsCreatingWorkspace(true);
    setWorkspaceError(null);

    const result = await createWorkspace(trimmed);

    setIsCreatingWorkspace(false);

    if (result.error) {
      setWorkspaceError(result.error);
      return;
    }

    setWorkspaceName("");
    setShowWorkspaceInput(false);
  };

  return (
    <View
      style={{
        width: 300,
        borderRightWidth: 1,
        borderRightColor: palette.line,
        backgroundColor: "rgba(255,255,255,0.35)",
        overflow: "hidden",
      }}
    >
      <BlurView intensity={72} tint="light" style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 16 }}>
          <Logo size={32} />
          <Text style={{ marginTop: 8, color: palette.textMuted, fontFamily: fonts.medium, fontSize: 12 }}>
            Welcome, {getFirstName(user)}
          </Text>

          <View style={{ marginTop: 22, gap: 8 }}>
            {[
              { label: "Dashboard", icon: "home", path: "/(tabs)" },
              { label: "Settings", icon: "cog", path: "/(tabs)/settings" },
            ].map((item) => {
              const active =
                item.path === "/(tabs)"
                  ? pathname === "/" || pathname.startsWith("/(tabs)/index") || pathname === "/(tabs)"
                  : pathname.includes("/settings");

              return (
                <TouchableOpacity
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 14,
                    minHeight: 42,
                    paddingHorizontal: 12,
                    backgroundColor: active ? "rgba(21,21,21,0.12)" : "transparent",
                  }}
                >
                  <FontAwesome name={item.icon as keyof typeof FontAwesome.glyphMap} size={16} color={palette.text} />
                  <Text style={{ marginLeft: 10, color: palette.text, fontWeight: active ? "700" : "600", fontFamily: fonts.medium }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 8 }}>
            <Text style={typeStyles.label}>Workspaces</Text>
            <TouchableOpacity
              onPress={() => {
                setShowWorkspaceInput((current) => !current);
                setWorkspaceError(null);
              }}
              style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(21,21,21,0.1)" }}
            >
              <FontAwesome name={showWorkspaceInput ? "minus" : "plus"} size={12} color={palette.text} />
            </TouchableOpacity>
          </View>

          {showWorkspaceInput ? (
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: palette.line,
                    backgroundColor: "rgba(255,255,255,0.58)",
                    paddingHorizontal: 10,
                    justifyContent: "center",
                    minHeight: 38,
                  }}
                >
                  <TextInput
                    value={workspaceName}
                    onChangeText={setWorkspaceName}
                    placeholder="New workspace"
                    placeholderTextColor={palette.textMuted}
                    style={{ color: palette.text, fontSize: 14, fontFamily: fonts.medium }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleCreateWorkspace}
                  disabled={isCreatingWorkspace || !workspaceName.trim()}
                  style={{
                    minWidth: 64,
                    minHeight: 38,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: !workspaceName.trim() ? "rgba(21,21,21,0.2)" : palette.text,
                  }}
                >
                  {isCreatingWorkspace ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Create</Text>}
                </TouchableOpacity>
              </View>
              {workspaceError ? <Text style={{ marginTop: 6, color: palette.danger, fontSize: 12 }}>{workspaceError}</Text> : null}
            </View>
          ) : null}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {orderedWorkspaces.map((workspace) => {
              const active = workspace.id === activeWorkspaceId;
              const lists = listsByWorkspace[workspace.id] || [];

              return (
                <View key={workspace.id} style={{ marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => setActiveWorkspace(workspace.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      alignSelf: "flex-start",
                      minHeight: 34,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? palette.text : palette.line,
                      backgroundColor: active ? "rgba(21,21,21,0.12)" : "rgba(255,255,255,0.45)",
                      paddingHorizontal: 11,
                    }}
                  >
                    <FontAwesome name={active ? "folder-open" : "folder"} size={13} color={palette.text} />
                    <Text style={{ marginLeft: 7, color: palette.text, fontSize: 13, fontWeight: "600", fontFamily: fonts.medium }}>{workspace.name}</Text>
                  </TouchableOpacity>

                  {active ? (
                    <View style={{ marginTop: 6, marginLeft: 14 }}>
                      <TouchableOpacity
                        onPress={() => router.push("/list/create")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          minHeight: 30,
                          marginBottom: 4,
                        }}
                      >
                        <FontAwesome name="plus-circle" size={13} color={palette.textMuted} />
                        <Text style={{ marginLeft: 7, color: palette.textMuted, fontSize: 12, fontFamily: fonts.medium }}>Add list</Text>
                      </TouchableOpacity>

                      {isLoadingLists ? (
                        <ActivityIndicator size="small" color={palette.textMuted} style={{ alignSelf: "flex-start", marginTop: 4 }} />
                      ) : lists.length === 0 ? (
                        <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 2 }}>No lists yet</Text>
                      ) : (
                        lists.map((list) => {
                          const listActive = pathname.includes(`/list/${list.id}`);
                          return (
                            <TouchableOpacity
                              key={list.id}
                              onPress={() => router.push(`/list/${list.id}`)}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                minHeight: 32,
                                borderRadius: 9,
                                paddingHorizontal: 8,
                                backgroundColor: listActive ? "rgba(21,21,21,0.12)" : "transparent",
                                marginBottom: 3,
                              }}
                            >
                              <FontAwesome
                                name={safeIconName(list.icon || undefined) as keyof typeof FontAwesome.glyphMap}
                                size={12}
                                color={palette.text}
                                style={{ width: 14 }}
                              />
                              <Text numberOfLines={1} style={{ marginLeft: 7, color: palette.text, fontSize: 13, fontFamily: fonts.medium }}>
                                {list.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={{ borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12, marginTop: 8 }}>
            <TouchableOpacity onPress={signOut} style={{ minHeight: 42, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }}>
              <FontAwesome name="sign-out" size={15} color={palette.textMuted} />
              <Text style={{ marginLeft: 8, color: palette.textMuted, fontWeight: "600", fontFamily: fonts.medium }}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </View>
  );
}
