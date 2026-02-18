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
        user?.user_metadata?.name?.split(" ")[0] ||
        user?.email?.split("@")[0]?.split(/[._-]/)[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) ||
        "Friend";

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

    useEffect(() => {
        if (!user) return;

        fetchLists();
        fetchInvites();

        // Real-time synchronization
        const channel = supabase
            .channel('dashboard-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
                fetchLists();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_shares' }, () => {
                fetchInvites();
                fetchLists();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

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

    const respondToInvite = async (inviteId: string, status: 'accepted' | 'declined') => {
        try {
            if (status === 'declined') {
                const { error } = await supabase
                    .from("list_shares")
                    .delete()
                    .eq("id", inviteId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("list_shares")
                    .update({ status: 'accepted' })
                    .eq("id", inviteId);
                if (error) throw error;
            }

            // Refresh
            fetchInvites();
            fetchLists();

            if (status === 'accepted') {
                if (Platform.OS === 'web') window.alert("Invitation accepted!");
            }
        } catch (err: any) {
            Alert.alert("Error", `Could not ${status} invite.`);
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
                    backgroundColor: "rgba(255,255,255,0.7)",
                    padding: 16,
                    borderRadius: 30,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: isPinned ? "rgba(142, 138, 251, 0.3)" : "rgba(255,255,255,0.5)",
                    shadowColor: "#8E8AFB",
                    shadowOpacity: 0.08,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 4,
                }}
                onPress={() => router.push(`/list/${item.id}`)}
                activeOpacity={0.8}
            >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); openIconPicker(item); }}
                        style={{
                            height: 56,
                            width: 56,
                            backgroundColor: "white",
                            borderRadius: 20,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                            shadowColor: "#8E8AFB",
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 5 },
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.8)"
                        }}
                    >
                        <Text style={{ fontSize: 28 }}>{item.icon || "🛒"}</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            {isPinned && <FontAwesome name="thumb-tack" size={12} color="#8E8AFB" style={{ marginRight: 8, transform: [{ rotate: '45deg' }] }} />}
                            <Text style={{ fontSize: 19, fontWeight: "800", color: "#000000" }} numberOfLines={1}>{item.name}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                            <Text style={{ color: "#71717A", fontSize: 14, fontWeight: "600" }}>View items</Text>
                            <FontAwesome name="chevron-right" size={10} color="#D1D1D6" style={{ marginLeft: 6 }} />
                        </View>
                    </View>
                </View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); openActions(item); }} style={{ padding: 12 }} hitSlop={12}>
                    <FontAwesome name="ellipsis-h" size={18} color="#A1A1AA" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    if (!isFocused) return <View style={{ flex: 1, backgroundColor: "transparent" }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32, marginTop: 16 }}>
                    <Logo size={48} />
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#71717A", fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
                            Hey,
                        </Text>
                        <Text style={{ fontSize: 32, fontWeight: "900", color: "#000000" }}>
                            {firstName}
                        </Text>
                    </View>
                </View>

                {/* Pending Invites */}
                {pendingInvites.length > 0 && (
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#A1A1AA", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, marginLeft: 8 }}>
                            Pending Invites
                        </Text>
                        {pendingInvites.map((invite) => (
                            <View
                                key={invite.id}
                                style={{
                                    backgroundColor: "rgba(255, 241, 241, 0.7)",
                                    padding: 20,
                                    borderRadius: 28,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    borderWidth: 1,
                                    borderColor: "rgba(255, 126, 115, 0.2)",
                                    marginBottom: 12,
                                    shadowColor: "#FF7E73",
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 15,
                                    elevation: 2
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                    <View style={{ width: 48, height: 48, backgroundColor: "white", borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 }}>
                                        <Text style={{ fontSize: 24 }}>{invite.lists?.icon || "🛒"}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 17, fontWeight: "800", color: "#000000" }}>{invite.lists?.name}</Text>
                                        <Text style={{ color: "#71717A", fontSize: 14, fontWeight: "500" }}>Invite from someone</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: "row" }}>
                                    <TouchableOpacity
                                        onPress={() => respondToInvite(invite.id, "accepted")}
                                        style={{ backgroundColor: "#8E8AFB", width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 8 }}
                                    >
                                        <FontAwesome name="check" size={18} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => respondToInvite(invite.id, "declined")}
                                        style={{ backgroundColor: "white", width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255, 126, 115, 0.3)" }}
                                    >
                                        <FontAwesome name="times" size={18} color="#FF7E73" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Search Bar */}
                <View style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: 26,
                    paddingHorizontal: 20,
                    height: 60,
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.8)",
                    shadowColor: "#8E8AFB",
                    shadowOpacity: 0.05,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 4
                }}>
                    <FontAwesome name="search" size={16} color="#A1A1AA" style={{ marginRight: 12 }} />
                    <TextInput
                        placeholder="Search your lists..."
                        placeholderTextColor="#A1A1AA"
                        style={{ flex: 1, fontSize: 17, fontWeight: "600", color: "#000000" }}
                    />
                </View>

                {/* Lists Section */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#A1A1AA", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, marginLeft: 8 }}>
                    My Lists
                </Text>
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
