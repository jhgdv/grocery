import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { GlassCard } from "../../components/GlassCard";
import { IconPickerModal } from "../../components/IconPickerModal";
import { LiquidButton } from "../../components/LiquidButton";
import { ListActionModal } from "../../components/ListActionModal";
import { AnimatedGradientText } from "../../components/AnimatedGradientText";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { friendlyError, getFirstName, palette, safeIconName, typeStyles } from "../../lib/design";
import { supabase } from "../../lib/supabase";
import { encodeWorkspaceListName, parseWorkspaceTaggedName, PERSONAL_WORKSPACE_ID } from "../../lib/workspaceFallback";

const PIN_STORAGE_KEY = "pinned_lists";

type ItemRow = {
  id: string;
  checked: boolean;
};

type ListRow = {
  id: string;
  name: string;
  raw_name?: string;
  icon?: string | null;
  created_at?: string | null;
  user_id?: string | null;
  workspace_id?: string | null;
  items?: ItemRow[];
};

type ListShareInvite = {
  id: string;
  lists?: { name: string; icon?: string | null } | null;
};

export default function ListsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const {
    activeWorkspace,
    activeWorkspaceId,
    invites: workspaceInvites,
    loading: workspaceLoading,
    respondToInvite,
    schemaReady,
    setActiveWorkspace,
    workspaces,
  } = useWorkspace();

  const [lists, setLists] = useState<ListRow[]>([]);
  const [pendingListInvites, setPendingListInvites] = useState<ListShareInvite[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedList, setSelectedList] = useState<ListRow | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const firstName = getFirstName(user);

  useEffect(() => {
    AsyncStorage.getItem(PIN_STORAGE_KEY)
      .then((value) => {
        if (value) setPinnedIds(new Set(JSON.parse(value)));
      })
      .catch(() => {
        setPinnedIds(new Set());
      });
  }, []);

  const persistPins = async (nextSet: Set<string>) => {
    setPinnedIds(nextSet);
    await AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(Array.from(nextSet)));
  };

  const togglePin = async (listId: string) => {
    const nextSet = new Set(pinnedIds);
    if (nextSet.has(listId)) nextSet.delete(listId);
    else nextSet.add(listId);
    await persistPins(nextSet);
  };

  const fetchListInvites = useCallback(async () => {
    if (!user?.email) return;

    const inviteRes = await supabase
      .from("list_shares")
      .select("id, lists(name, icon)")
      .eq("invited_email", user.email.toLowerCase())
      .eq("status", "pending");

    if (inviteRes.error) {
      if (inviteRes.error.code !== "PGRST205") {
        console.log("list invite fetch error", inviteRes.error);
      }
      setPendingListInvites([]);
      return;
    }

    setPendingListInvites((inviteRes.data || []) as any[]);
  }, [user?.email]);

  const fetchLists = useCallback(async () => {
    if (!user) return;
    if (!activeWorkspaceId) {
      setLists([]);
      setLoadingLists(false);
      return;
    }

    setLoadingLists(true);

    try {
      if (!schemaReady) {
        const [ownedRes, sharedRes] = await Promise.all([
          supabase.from("lists").select("id,name,icon,user_id,created_at,items(id,checked)").eq("user_id", user.id),
          supabase
            .from("list_shares")
            .select("list_id, lists(id,name,icon,user_id,created_at,items(id,checked))")
            .eq("invited_email", user.email?.toLowerCase())
            .eq("status", "accepted"),
        ]);

        if (ownedRes.error) throw ownedRes.error;

        const sharedLists = ((sharedRes.data || []) as any[]).map((row) => row.lists).filter(Boolean);
        const merged = Array.from(
          new Map([...(ownedRes.data || []), ...sharedLists].map((row: any) => [row.id, row])).values()
        ) as ListRow[];

        const knownWorkspaceIds = new Set(workspaces.map((workspace) => workspace.id));
        const normalized = merged.map((row) => {
          const parsed = parseWorkspaceTaggedName(row.name);
          const workspaceId = knownWorkspaceIds.has(parsed.workspaceId) ? parsed.workspaceId : PERSONAL_WORKSPACE_ID;
          return {
            ...row,
            raw_name: row.name,
            name: parsed.name,
            workspace_id: workspaceId,
          };
        });

        const filtered = normalized.filter((row) =>
          activeWorkspaceId === PERSONAL_WORKSPACE_ID
            ? row.workspace_id === PERSONAL_WORKSPACE_ID
            : row.workspace_id === activeWorkspaceId
        );

        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setLists(filtered);
        return;
      }

      const workspaceRes = await supabase
        .from("lists")
        .select("id,name,icon,user_id,workspace_id,created_at,items(id,checked)")
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: false });

      if (workspaceRes.error) throw workspaceRes.error;

      setLists((workspaceRes.data || []) as ListRow[]);
    } catch (error) {
      console.log("fetch lists error", error);
      Alert.alert("Error", friendlyError(error));
    } finally {
      setLoadingLists(false);
    }
  }, [user?.id, user?.email, activeWorkspaceId, schemaReady, workspaces]);

  useEffect(() => {
    if (!user) return;
    fetchLists();
    fetchListInvites();

    const channel = supabase
      .channel("lists-screen-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "lists" }, fetchLists)
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, fetchLists)
      .on("postgres_changes", { event: "*", schema: "public", table: "list_shares" }, () => {
        fetchListInvites();
        fetchLists();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_members" }, fetchLists)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchLists, fetchListInvites]);

  useFocusEffect(
    useCallback(() => {
      fetchLists();
      fetchListInvites();
    }, [fetchLists, fetchListInvites])
  );

  const respondToListInvite = async (inviteId: string, status: "accepted" | "declined") => {
    try {
      if (status === "declined") {
        const declineRes = await supabase.from("list_shares").delete().eq("id", inviteId);
        if (declineRes.error) throw declineRes.error;
      } else {
        const acceptRes = await supabase.from("list_shares").update({ status: "accepted" }).eq("id", inviteId);
        if (acceptRes.error) throw acceptRes.error;
      }

      await fetchListInvites();
      await fetchLists();
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const deleteRes = await supabase.from("lists").delete().eq("id", listId);
      if (deleteRes.error) throw deleteRes.error;

      setLists((previous) => previous.filter((list) => list.id !== listId));
      const nextPins = new Set(pinnedIds);
      nextPins.delete(listId);
      await persistPins(nextPins);
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    }
  };

  const duplicateList = async (list: ListRow) => {
    try {
      const copiedName = `${list.name} Copy`;
      const insertPayload: any = {
        name: !schemaReady
          ? encodeWorkspaceListName(activeWorkspaceId || PERSONAL_WORKSPACE_ID, copiedName)
          : copiedName,
        icon: list.icon || "list-ul",
        user_id: user?.id,
      };

      if (schemaReady && activeWorkspaceId && activeWorkspaceId !== PERSONAL_WORKSPACE_ID) {
        insertPayload.workspace_id = activeWorkspaceId;
      }

      const duplicateRes = await supabase.from("lists").insert([insertPayload]).select("id").single();
      if (duplicateRes.error) throw duplicateRes.error;

      await fetchLists();
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    }
  };

  const updateListIcon = async (listId: string, icon: string) => {
    try {
      const updateRes = await supabase.from("lists").update({ icon }).eq("id", listId);
      if (updateRes.error) throw updateRes.error;

      setLists((previous) => previous.map((list) => (list.id === listId ? { ...list, icon } : list)));
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    }
  };

  const filteredLists = useMemo(() => {
    const sorted = [...lists].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return sorted.filter((list) => list.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [lists, pinnedIds, searchQuery]);

  const totalItems = lists.reduce((sum, list) => sum + (list.items?.length || 0), 0);
  const checkedItems = lists.reduce(
    (sum, list) => sum + (list.items || []).filter((item) => item.checked).length,
    0
  );

  if (!isFocused) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: Platform.OS === "web" ? 28 : 120,
        }}
      >
        <View style={{ marginBottom: 14 }}>
          <AnimatedGradientText
            text={`Hi ${firstName}`}
            style={typeStyles.title}
            colors={["#7366F6", "#F472B6", "#7366F6"]}
          />
          <Text style={[typeStyles.body, { marginTop: 6 }]}>Everything shared, organized, and synced.</Text>
        </View>

        <GlassCard style={{ padding: 14, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={typeStyles.label}>Workspace</Text>
            <TouchableOpacity
              onPress={() => router.push("/workspace/create" as any)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.accent,
              }}
            >
              <FontAwesome name="plus" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspaceId;
              return (
                <TouchableOpacity
                  key={workspace.id}
                  onPress={() => setActiveWorkspace(workspace.id)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? palette.accent : palette.line,
                    backgroundColor: active ? palette.accent : "rgba(255,255,255,0.42)",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: active ? "#fff" : palette.text, fontWeight: "600" }}>{workspace.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </GlassCard>

        {workspaceInvites.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={[typeStyles.label, { marginBottom: 8 }]}>Workspace invites</Text>
            {workspaceInvites.map((invite) => (
              <GlassCard key={invite.id} style={{ padding: 14, marginBottom: 8 }}>
                <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>
                  {invite.workspaces?.name || "Workspace"}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
                  <LiquidButton onPress={() => respondToInvite(invite.id, "accepted")} label="Accept" size="sm" />
                  <LiquidButton
                    onPress={() => respondToInvite(invite.id, "declined")}
                    label="Decline"
                    size="sm"
                    variant="secondary"
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        ) : null}

        {pendingListInvites.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={[typeStyles.label, { marginBottom: 8 }]}>List invites</Text>
            {pendingListInvites.map((invite) => (
              <GlassCard key={invite.id} style={{ padding: 14, marginBottom: 8 }}>
                <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>
                  {invite.lists?.name || "Shared list"}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
                  <LiquidButton onPress={() => respondToListInvite(invite.id, "accepted")} label="Accept" size="sm" />
                  <LiquidButton
                    onPress={() => respondToListInvite(invite.id, "declined")}
                    label="Decline"
                    size="sm"
                    variant="secondary"
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <GlassCard style={{ flex: 1, padding: 14 }}>
            <Text style={typeStyles.label}>Lists</Text>
            <Text style={{ color: palette.text, fontSize: 28, fontWeight: "700", marginTop: 8 }}>{lists.length}</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, padding: 14 }}>
            <Text style={typeStyles.label}>Progress</Text>
            <Text style={{ color: palette.text, fontSize: 28, fontWeight: "700", marginTop: 8 }}>
              {totalItems === 0 ? "0%" : `${Math.round((checkedItems / totalItems) * 100)}%`}
            </Text>
          </GlassCard>
        </View>

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.line,
            backgroundColor: "rgba(255,255,255,0.55)",
            minHeight: 48,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <FontAwesome name="search" size={16} color={palette.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lists"
            placeholderTextColor={palette.textMuted}
            style={{ flex: 1, marginLeft: 10, color: palette.text, fontSize: 15 }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome name="times-circle" size={18} color={palette.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <AnimatedGradientText
            text={activeWorkspace?.name || "Lists"}
            style={typeStyles.h2}
            colors={["#7366F6", "#F472B6", "#7366F6"]}
          />
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {schemaReady && activeWorkspaceId && activeWorkspaceId !== "personal" ? (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/share/invite" as any, params: { workspaceId: activeWorkspaceId } })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: palette.line,
                  backgroundColor: "rgba(255,255,255,0.55)",
                }}
              >
                <FontAwesome name="user-plus" size={14} color={palette.accent} />
              </TouchableOpacity>
            ) : null}
            <LiquidButton onPress={() => router.push("/list/create")} icon="plus" label="New list" size="sm" />
          </View>
        </View>

        {workspaceLoading || loadingLists ? (
          <View style={{ paddingVertical: 30, alignItems: "center" }}>
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : filteredLists.length === 0 ? (
          <GlassCard style={{ padding: 20, alignItems: "center" }}>
            <FontAwesome name="list-ul" size={26} color={palette.textMuted} />
            <Text style={{ color: palette.text, fontWeight: "700", marginTop: 8 }}>No lists yet</Text>
            <Text style={{ color: palette.textSoft, marginTop: 4 }}>Create your first shared list.</Text>
          </GlassCard>
        ) : (
          filteredLists.map((list) => {
            const items = list.items || [];
            const done = items.filter((item) => item.checked).length;
            const progress = items.length ? done / items.length : 0;
            const isPinned = pinnedIds.has(list.id);
            const isShared = !!(user?.id && list.user_id && list.user_id !== user.id);

            return (
              <GlassCard
                key={list.id}
                onPress={() => router.push(`/list/${list.id}`)}
                style={{ padding: 14, marginBottom: 10 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: "rgba(21,21,21,0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome
                      name={safeIconName(list.icon || undefined) as keyof typeof FontAwesome.glyphMap}
                      size={19}
                      color={palette.text}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text numberOfLines={1} style={{ flex: 1, color: palette.text, fontSize: 16, fontWeight: "700" }}>
                        {list.name}
                      </Text>
                      {isPinned ? <FontAwesome name="thumb-tack" size={12} color={palette.textMuted} /> : null}
                    </View>
                    <Text style={{ color: palette.textSoft, marginTop: 4, fontSize: 13 }}>
                      {items.length ? `${done}/${items.length} completed` : "Empty list"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={(event) => {
                      event.stopPropagation();
                      setSelectedList(list);
                      setActionModalVisible(true);
                    }}
                    style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
                  >
                    <FontAwesome name="ellipsis-v" size={16} color={palette.textMuted} />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    marginTop: 12,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: "rgba(21,21,21,0.12)",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ width: `${progress * 100}%`, backgroundColor: palette.accent, height: "100%" }} />
                </View>

                {isShared ? (
                  <View style={{ marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(21,21,21,0.09)" }}>
                    <Text style={{ color: palette.text, fontSize: 11, fontWeight: "700" }}>Shared</Text>
                  </View>
                ) : null}
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      <ListActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        title={selectedList?.name || "Actions"}
        actions={[
          {
            icon: "thumb-tack",
            label: selectedList && pinnedIds.has(selectedList.id) ? "Unpin" : "Pin",
            action: () => {
              if (selectedList) togglePin(selectedList.id);
            },
          },
          {
            icon: "smile-o",
            label: "Change icon",
            action: () => {
              setActionModalVisible(false);
              setIconModalVisible(true);
            },
          },
          {
            icon: "clone",
            label: "Duplicate",
            action: () => {
              if (selectedList) duplicateList(selectedList);
            },
          },
          {
            icon: "share-alt",
            label: "Share",
            action: () => {
              const workspaceId =
                schemaReady && activeWorkspaceId && activeWorkspaceId !== PERSONAL_WORKSPACE_ID
                  ? activeWorkspaceId
                  : undefined;
              router.push({ pathname: "/share/invite" as any, params: { workspaceId, listId: selectedList?.id } });
            },
          },
          ...(selectedList?.user_id === user?.id
            ? [
              {
                icon: "trash-o" as const,
                label: "Delete",
                action: () => {
                  if (selectedList) deleteList(selectedList.id);
                },
                destructive: true,
              },
            ]
            : []),
        ]}
      />

      <IconPickerModal
        visible={iconModalVisible}
        onClose={() => setIconModalVisible(false)}
        selectedIcon={selectedList?.icon || undefined}
        onSelect={(icon) => {
          if (selectedList) updateListIcon(selectedList.id, icon);
        }}
      />
    </SafeAreaView>
  );
}
