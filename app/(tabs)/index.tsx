import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { Logo } from "../../components/Logo";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { ListActionModal } from "../../components/ListActionModal";
import { IconPickerModal } from "../../components/IconPickerModal";
import { supabase } from "../../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PIN_STORAGE_KEY = "pinned_lists";

export default function Lists() {
    const router = useRouter();
    const { user } = useAuth();
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedList, setSelectedList] = useState<any>(null);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [iconModalVisible, setIconModalVisible] = useState(false);
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const isFocused = useIsFocused();

    const firstName =
        user?.user_metadata?.full_name?.split(" ")[0] ||
        user?.email?.split("@")[0]?.split(/[._-]/)[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) ||
        "Gat";

    useEffect(() => {
        loadPinnedIds();
    }, []);

    const loadPinnedIds = async () => {
        try {
            const stored = await AsyncStorage.getItem(PIN_STORAGE_KEY);
            if (stored) setPinnedIds(new Set(JSON.parse(stored)));
        } catch (e) { /* ignore */ }
    };

    const savePinnedIds = async (ids: Set<string>) => {
        try {
            await AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify([...ids]));
        } catch (e) { /* ignore */ }
    };

    const togglePin = (listId: string) => {
        const next = new Set(pinnedIds);
        if (next.has(listId)) {
            next.delete(listId);
        } else {
            next.add(listId);
        }
        setPinnedIds(next);
        savePinnedIds(next);
    };

    useFocusEffect(
        useCallback(() => {
            fetchLists();
            fetchInvites();
        }, [user])
    );

    const fetchInvites = async () => {
        if (!user?.email) return;
        try {
            const { data, error } = await supabase
                .from("list_shares")
                .select("*, lists(name, icon)")
                .eq("invited_email", user.email.toLowerCase())
                .eq("status", "pending");

            if (error) {
                if (error.code !== 'PGRST204') console.log("Invites fetch error:", error);
            } else {
                setPendingInvites(data || []);
            }
        } catch (err) {
            console.log("Error fetching invites:", err);
        }
    };

    const acceptInvite = async (inviteId: string) => {
        try {
            const { error } = await supabase
                .from("list_shares")
                .update({ status: 'accepted' })
                .eq("id", inviteId);

            if (error) throw error;

            // Refresh
            fetchInvites();
            fetchLists();

            if (Platform.OS === 'web') window.alert("Invitation accepted!");
        } catch (err: any) {
            Alert.alert("Error", "Could not accept invite.");
        }
    };

    const fetchLists = async () => {
        if (!user) return;
        try {
            setLoading(true);

            // Fetch lists owned by the user
            const { data: ownedLists, error: ownedError } = await supabase
                .from("lists")
                .select("*")
                .eq("user_id", user.id);

            if (ownedError) throw ownedError;

            // Fetch lists shared with the user
            const { data: sharedShares, error: sharedError } = await supabase
                .from("list_shares")
                .select("list_id, lists(*)")
                .eq("invited_email", user.email?.toLowerCase())
                .eq("status", "accepted");

            if (sharedError && sharedError.code !== 'PGRST204') {
                console.log("Shared lists fetch error:", sharedError);
            }

            const sharedLists = (sharedShares || [])
                .map(share => share.lists)
                .filter(Boolean);

            // Combine and sort
            const allLists = [...(ownedLists || []), ...sharedLists];
            const uniqueLists = Array.from(new Map(allLists.map(l => [l.id, l])).values());

            setLists(uniqueLists.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ));
        } catch (error: any) {
            console.log("Error fetching lists:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteList = async (id: string) => {
        try {
            const { error } = await supabase.from("lists").delete().eq("id", id);
            if (error) throw error;
            setLists((prev) => prev.filter((l) => l.id !== id));
            const next = new Set(pinnedIds);
            next.delete(id);
            setPinnedIds(next);
            savePinnedIds(next);
        } catch (error: any) {
            Alert.alert("Error", "Could not delete list");
        }
    };

    const updateListIcon = async (listId: string, icon: string) => {
        try {
            const { error } = await supabase.from("lists").update({ icon }).eq("id", listId);
            if (error) throw error;
            setLists(prev => prev.map(l => l.id === listId ? { ...l, icon } : l));
        } catch (error) {
            Alert.alert("Error", "Could not update icon");
        }
    };

    const duplicateList = async (list: any) => {
        try {
            const { data, error } = await supabase
                .from("lists")
                .insert([{ name: `${list.name} (Copy)`, user_id: user?.id, icon: list.icon }])
                .select()
                .single();
            if (error) throw error;
            setLists((prev) => [data, ...prev]);
        } catch (error: any) {
            Alert.alert("Error", "Could not duplicate list");
        }
    };

    const reorderList = async (direction: "up" | "down", list: any) => {
        const index = sortedLists.findIndex(l => l.id === list.id);
        if (index === -1) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sortedLists.length) return;

        const targetList = sortedLists[targetIndex];

        // Pin logic: you can only reorder pinned with pinned or unpinned with unpinned to avoid jumping
        const listIsPinned = pinnedIds.has(list.id);
        const targetIsPinned = pinnedIds.has(targetList.id);
        if (listIsPinned !== targetIsPinned) return;

        const listTimestamp = list.created_at;
        const targetTimestamp = targetList.created_at;

        // DB Update
        try {
            await Promise.all([
                supabase.from("lists").update({ created_at: targetTimestamp }).eq("id", list.id),
                supabase.from("lists").update({ created_at: listTimestamp }).eq("id", targetList.id)
            ]);
            fetchLists(); // Refresh
        } catch (error) {
            console.error("Failed to reorder list", error);
        }
    };

    const openActions = (list: any) => {
        setSelectedList(list);
        setActionModalVisible(true);
    };

    const openIconPicker = (list: any) => {
        setSelectedList(list);
        setIconModalVisible(true);
    };

    const sortedLists = [...lists].sort((a, b) => {
        const aPinned = pinnedIds.has(a.id);
        const bPinned = pinnedIds.has(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        // Secondary sort by created_at descending (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const renderItem = ({ item }: { item: any }) => {
        const isPinned = pinnedIds.has(item.id);
        return (
            <TouchableOpacity
                style={{
                    backgroundColor: "rgba(255,255,255,0.7)", // More transparent as requested
                    padding: 18,
                    borderRadius: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: isPinned ? "#86efac" : "rgba(229,231,235,0.6)",
                    shadowColor: "#000",
                    shadowOpacity: 0.02,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 2 },
                }}
                onPress={() => router.push(`/list/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    {/* Reorder Arrows */}
                    <View style={{ marginRight: 12, alignItems: "center" }}>
                        <TouchableOpacity onPress={() => reorderList("up", item)} style={{ padding: 4 }}>
                            <FontAwesome name="chevron-up" size={10} color="#9ca3af" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => reorderList("down", item)} style={{ padding: 4 }}>
                            <FontAwesome name="chevron-down" size={10} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); openIconPicker(item); }}
                        style={{ height: 44, width: 44, backgroundColor: "#D97D7315", borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 16, borderWidth: 1, borderColor: "#D97D7320" }}
                    >
                        <Text style={{ fontSize: 22 }}>{item.icon || "🛒"}</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            {isPinned && <FontAwesome name="thumb-tack" size={12} color="#22c55e" style={{ marginRight: 6 }} />}
                            <Text style={{ fontSize: 17, fontWeight: "700", color: "#000000" }} numberOfLines={1}>{item.name}</Text>
                        </View>
                        <Text style={{ color: "#4b5563", fontSize: 14, fontWeight: "500", marginTop: 2 }}>View items</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); openActions(item); }} style={{ padding: 8 }} hitSlop={8}>
                    <FontAwesome name="ellipsis-v" size={16} color="#9ca3af" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    if (!isFocused) return <View style={{ flex: 1, backgroundColor: "transparent" }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, marginTop: 8 }}>
                    <Logo size={44} />
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                            Welcome back,
                        </Text>
                        <Text style={{ fontSize: 28, fontWeight: "800", color: "#1f2937" }}>
                            {firstName}
                        </Text>
                    </View>
                </View>

                {/* Pending Invites */}
                {pendingInvites.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, marginLeft: 4 }}>
                            Pending Invites
                        </Text>
                        {pendingInvites.map((invite) => (
                            <View
                                key={invite.id}
                                style={{
                                    backgroundColor: "white",
                                    padding: 16,
                                    borderRadius: 16,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    borderWidth: 1,
                                    borderColor: "#D97D7340",
                                    marginBottom: 8,
                                    shadowColor: "#D97D73",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 3
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                    <View style={{ width: 40, height: 40, backgroundColor: "#D97D7315", borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                                        <Text style={{ fontSize: 20 }}>{invite.lists?.icon || "🛒"}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: "700", fontSize: 15, color: "#1f2937" }}>{invite.lists?.name}</Text>
                                        <Text style={{ color: "#6b7280", fontSize: 12 }}>Invited you to collaborate</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => acceptInvite(invite.id)}
                                    style={{ backgroundColor: "#D97D73", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
                                >
                                    <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Accept</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Search */}
                <View style={{ marginBottom: 20, backgroundColor: "rgba(255,255,255,0.7)", padding: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(229,231,235,0.6)" }}>
                    <FontAwesome name="search" size={14} color="#9ca3af" style={{ marginLeft: 6, marginRight: 10 }} />
                    <TextInput placeholder="Search lists..." style={{ flex: 1, color: "#1f2937", fontWeight: "500", fontSize: 15 }} placeholderTextColor="#9ca3af" />
                </View>

                {loading ? (
                    <ActivityIndicator color="#D97D73" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={sortedLists}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                        onRefresh={fetchLists}
                        ListEmptyComponent={
                            <View style={{ alignItems: "center", justifyContent: "center", marginTop: 80, opacity: 0.5 }}>
                                <FontAwesome name="shopping-basket" size={48} color="#9ca3af" />
                                <Text style={{ color: "#9ca3af", fontSize: 18, marginTop: 16, fontWeight: "600" }}>No lists yet</Text>
                                <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>Tap + to get started</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <ListActionModal
                visible={actionModalVisible}
                onClose={() => setActionModalVisible(false)}
                title={selectedList?.name || "Options"}
                actions={[
                    {
                        icon: "thumb-tack",
                        label: pinnedIds.has(selectedList?.id) ? "Unpin" : "Pin",
                        action: () => togglePin(selectedList?.id),
                        color: "#22c55e",
                    },
                    { icon: "smile-o", label: "Change Icon", action: () => { setActionModalVisible(false); setIconModalVisible(true); }, color: "#D97D73" },
                    { icon: "clone", label: "Duplicate", action: () => duplicateList(selectedList), color: "#1f2937" },
                    { icon: "share-alt", label: "Share", action: () => router.push({ pathname: "/share/invite" as any, params: { listId: selectedList?.id } }), color: "#1f2937" },
                    { icon: "trash-o", label: "Delete", action: () => deleteList(selectedList?.id), destructive: true },
                ]}
            />

            <IconPickerModal
                visible={iconModalVisible}
                onClose={() => setIconModalVisible(false)}
                onSelect={(icon) => updateListIcon(selectedList.id, icon)}
                selectedIcon={selectedList?.icon}
            />
        </SafeAreaView>
    );
}
