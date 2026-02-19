import React, { useEffect, useState, useCallback } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    SafeAreaView, 
    TextInput, 
    ActivityIndicator, 
    Alert, 
    Platform,
    Image,
    ScrollView
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { ListActionModal } from "../../components/ListActionModal";
import { IconPickerModal } from "../../components/IconPickerModal";
import { supabase } from "../../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PIN_STORAGE_KEY = "pinned_lists";

const COLORS = {
    bg: "#F4F6FC",
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primaryLight: "#91BBE6",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    dark: "#1E3A6E",
    darkSoft: "rgba(30, 58, 110, 0.1)",
    pink: "#F4B8CE",
    pinkSoft: "rgba(244, 184, 206, 0.2)",
    accent: "#B39DDB",
    accentSoft: "rgba(179, 157, 219, 0.12)",
    success: "#5BC8A4",
    successSoft: "rgba(91, 200, 164, 0.1)",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    borderLight: "#EEF3FA",
};

function AppCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.88}
            style={[
                {
                    backgroundColor: COLORS.white,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    shadowColor: "#6BA0D8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 10,
                    elevation: 2,
                },
                style
            ]}
        >
            {children}
        </TouchableOpacity>
    );
}

// Stats Card Component
function StatsCard({ icon, value, label, color, iconColor }: { icon: string; value: string; label: string; color: string; iconColor?: string }) {
    return (
        <View style={{
            flex: 1,
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
            shadowColor: "#6BA0D8",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
        }}>
            <View style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: color,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
            }}>
                <FontAwesome name={icon as any} size={20} color={iconColor || COLORS.primary} />
            </View>
            <Text style={{
                fontSize: 24,
                fontWeight: "800",
                color: COLORS.text,
                marginBottom: 2,
            }}>
                {value}
            </Text>
            <Text style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                fontWeight: "500",
            }}>
                {label}
            </Text>
        </View>
    );
}

export default function Lists() {
    const router = useRouter();
    const { user } = useAuth();
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedList, setSelectedList] = useState<any>(null);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [iconModalVisible, setIconModalVisible] = useState(false);
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
    const [sharedWithMeIds, setSharedWithMeIds] = useState<Set<string>>(new Set());
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const isFocused = useIsFocused();

    const firstName =
        user?.user_metadata?.full_name?.split(" ")[0] ||
        user?.user_metadata?.name?.split(" ")[0] ||
        user?.email?.split("@")[0]?.split(/[._-]/)[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) ||
        "User";

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
            const { data: ownedLists, error: ownedError } = await supabase
                .from("lists")
                .select("*, items:items(id, checked)")
                .eq("user_id", user.id);

            if (ownedError) throw ownedError;

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

            setSharedWithMeIds(new Set((sharedShares || []).map((s: any) => s.list_id).filter(Boolean)));

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
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const filteredLists = sortedLists.filter(list =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderListIcon = (icon: string) => {
        const isEmoji = icon && (/\p{Emoji_Presentation}/u.test(icon) || (icon.length <= 2 && /\p{Emoji}/u.test(icon)));
        const iconName: any = (!icon || isEmoji) ? "shopping-basket" : icon;
        return (
            <View style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: COLORS.primarySoft,
                alignItems: "center",
                justifyContent: "center",
            }}>
                <FontAwesome name={iconName} size={22} color={COLORS.primary} />
            </View>
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const itemList: any[] = item.items || [];
        const totalItems = itemList.length;
        const checkedItems = itemList.filter((i: any) => i.checked).length;
        const progress = totalItems > 0 ? checkedItems / totalItems : 0;
        const isComplete = totalItems > 0 && checkedItems === totalItems;

        return (
            <AppCard
                style={{ marginBottom: 12 }}
                onPress={() => router.push(`/list/${item.id}`)}
            >
                <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
                    <View style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: isComplete ? COLORS.successSoft : COLORS.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        {(() => {
                            const isEmoji = item.icon && (/\p{Emoji_Presentation}/u.test(item.icon) || (item.icon.length <= 2 && /\p{Emoji}/u.test(item.icon)));
                            const iconName: any = (!item.icon || isEmoji) ? "list" : item.icon;
                            return <FontAwesome name={iconName} size={22} color={isComplete ? COLORS.success : COLORS.primary} />;
                        })()}
                    </View>

                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: "700",
                                color: COLORS.text,
                                flex: 1,
                            }} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {sharedWithMeIds.has(item.id) && (
                                <View style={{
                                    backgroundColor: COLORS.darkSoft,
                                    borderRadius: 6,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    marginLeft: 6,
                                }}>
                                    <Text style={{ fontSize: 9, fontWeight: "800", color: COLORS.dark, textTransform: "uppercase", letterSpacing: 0.4 }}>Shared</Text>
                                </View>
                            )}
                        </View>

                        {totalItems > 0 ? (
                            <View>
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: "500" }}>
                                        {isComplete ? "All done!" : `${checkedItems} of ${totalItems} done`}
                                    </Text>
                                    {pinnedIds.has(item.id) && (
                                        <FontAwesome name="thumb-tack" size={10} color={COLORS.textTertiary} style={{ marginLeft: 6 }} />
                                    )}
                                </View>
                                <View style={{
                                    height: 4,
                                    backgroundColor: COLORS.borderLight,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                }}>
                                    <View style={{
                                        height: 4,
                                        width: `${progress * 100}%` as any,
                                        backgroundColor: isComplete ? COLORS.success : COLORS.primary,
                                        borderRadius: 2,
                                    }} />
                                </View>
                            </View>
                        ) : (
                            <Text style={{ color: COLORS.textTertiary, fontSize: 13, fontWeight: "500" }}>
                                Empty — tap to add items
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); openActions(item); }}
                        style={{ padding: 10, borderRadius: 8 }}
                        hitSlop={12}
                    >
                        <FontAwesome name="ellipsis-v" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>
            </AppCard>
        );
    };

    const renderInviteCard = ({ item }: { item: any }) => (
        <AppCard style={{ marginBottom: 12 }}>
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
                <View style={{ 
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: COLORS.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <FontAwesome
                        name={(() => { const ic = item.lists?.icon; const isEmoji = ic && (/\p{Emoji_Presentation}/u.test(ic) || (ic.length <= 2 && /\p{Emoji}/u.test(ic))); return (!ic || isEmoji ? "shopping-basket" : ic) as any; })()}
                        size={22}
                        color={COLORS.primary}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ 
                        fontSize: 15, 
                        fontWeight: "700", 
                        color: COLORS.text,
                        marginBottom: 2,
                    }}>
                        {item.lists?.name}
                    </Text>
                    <Text style={{ 
                        color: COLORS.textSecondary, 
                        fontSize: 13,
                        fontWeight: "500"
                    }}>
                        Collaboration invite
                    </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => respondToInvite(item.id, "accepted")}
                        style={{
                            backgroundColor: COLORS.success,
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <FontAwesome name="check" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => respondToInvite(item.id, "declined")}
                        style={{
                            backgroundColor: COLORS.border,
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <FontAwesome name="times" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </AppCard>
    );

    if (!isFocused) return <View style={{ flex: 1, backgroundColor: "transparent" }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <ScrollView 
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20 }}
            >
                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 26,
                        fontWeight: "800",
                        color: COLORS.text,
                        marginBottom: 4,
                    }}>
                        Hello, {firstName}
                    </Text>
                    <Text style={{
                        fontSize: 15,
                        color: COLORS.textSecondary,
                        fontWeight: "500",
                    }}>
                        Here are your lists
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                    <StatsCard
                        icon="list"
                        value={String(lists.length)}
                        label="Lists"
                        color={COLORS.primarySoft}
                        iconColor={COLORS.primary}
                    />
                    <StatsCard
                        icon="users"
                        value={String(lists.length > 0 ? lists.length : 0)}
                        label="Shared"
                        color={COLORS.accentSoft}
                        iconColor={COLORS.accent}
                    />
                </View>

                {/* Pending Invites */}
                {pendingInvites.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: COLORS.text,
                            marginBottom: 12,
                        }}>
                            Pending Invites
                        </Text>
                        {pendingInvites.map((invite) => renderInviteCard({ item: invite }))}
                    </View>
                )}

                {/* Search Bar */}
                <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    height: 52,
                    marginBottom: 24,
                }}>
                    <FontAwesome name="search" size={18} color={COLORS.textTertiary} style={{ marginRight: 12 }} />
                    <TextInput
                        placeholder="Search lists..."
                        placeholderTextColor={COLORS.textTertiary}
                        style={{ 
                            flex: 1, 
                            fontSize: 15, 
                            fontWeight: "500", 
                            color: COLORS.text,
                        }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <FontAwesome name="times-circle" size={20} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Section Header */}
                <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: 16,
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: "800",
                        color: COLORS.text,
                    }}>
                        My Lists
                    </Text>
                    
                    <TouchableOpacity
                        onPress={() => router.push("/list/create")}
                        style={{
                            backgroundColor: COLORS.primary,
                            // @ts-ignore
                            background: 'linear-gradient(135deg, #6BA0D8 0%, #B39DDB 100%)',
                            width: 42,
                            height: 42,
                            borderRadius: 13,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: "#8A9FD8",
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        }}
                    >
                        <FontAwesome name="plus" size={18} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Lists */}
                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                    </View>
                ) : (
                    <>
                        {filteredLists.map((item) => renderItem({ item }))}
                        
                        {filteredLists.length === 0 && (
                            <View style={{ alignItems: "center", justifyContent: "center", marginTop: 60 }}>
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 24,
                                    backgroundColor: COLORS.borderLight,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 16,
                                }}>
                                    <FontAwesome name="list-ul" size={32} color={COLORS.textTertiary} />
                                </View>
                                <Text style={{
                                    color: COLORS.textSecondary,
                                    fontSize: 16,
                                    fontWeight: "600",
                                    marginBottom: 4,
                                }}>
                                    No lists yet
                                </Text>
                                <Text style={{
                                    color: COLORS.textTertiary,
                                    fontSize: 14,
                                }}>
                                    Create your first list
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <ListActionModal
                visible={actionModalVisible}
                onClose={() => setActionModalVisible(false)}
                title={selectedList?.name || "Options"}
                actions={[
                    {
                        icon: "thumb-tack",
                        label: pinnedIds.has(selectedList?.id) ? "Unpin" : "Pin",
                        action: () => togglePin(selectedList?.id),
                        color: COLORS.primary,
                    },
                    { 
                        icon: "smile-o", 
                        label: "Change Icon", 
                        action: () => { setActionModalVisible(false); setIconModalVisible(true); }, 
                        color: COLORS.text,
                    },
                    { 
                        icon: "clone", 
                        label: "Duplicate", 
                        action: () => duplicateList(selectedList), 
                        color: COLORS.text,
                    },
                    { 
                        icon: "share-alt", 
                        label: "Share", 
                        action: () => router.push({ pathname: "/share/invite" as any, params: { listId: selectedList?.id } }), 
                        color: COLORS.text,
                    },
                    { 
                        icon: "trash-o", 
                        label: "Delete", 
                        action: () => deleteList(selectedList?.id), 
                        destructive: true,
                    },
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
