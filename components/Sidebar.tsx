import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
    bg: "#F4F6FC",
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    accent: "#B39DDB",
    accentSoft: "rgba(179, 157, 219, 0.12)",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    borderLight: "#EEF3FA",
};

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [lists, setLists] = React.useState<any[]>([]);
    const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        loadPinnedIds();
    }, []);

    const loadPinnedIds = async () => {
        try {
            const stored = await AsyncStorage.getItem("pinned_lists");
            if (stored) setPinnedIds(new Set(JSON.parse(stored)));
        } catch (e) { /* ignore */ }
    };

    React.useEffect(() => {
        if (!user) return;

        loadPinnedIds();
        fetchLists();

        const listsChannel = supabase
            .channel('sidebar-lists')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
                fetchLists();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_shares' }, () => {
                fetchLists();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(listsChannel);
        };
    }, [user, pathname]);

    const fetchLists = async () => {
        if (!user) return;

        try {
            const [ownedRes, sharedRes] = await Promise.all([
                supabase.from("lists").select("*").eq("user_id", user.id),
                supabase.from("list_shares").select("list_id, lists(*)").eq("invited_email", user.email?.toLowerCase()).eq("status", "accepted")
            ]);

            if (ownedRes.error) throw ownedRes.error;

            const ownedLists = ownedRes.data || [];
            const sharedLists = (sharedRes.data || [])
                .map((share: any) => share.lists)
                .filter(Boolean);

            const allLists = [...ownedLists, ...sharedLists];
            const uniqueLists = Array.from(new Map(allLists.map(l => [l.id, l])).values());

            setLists(uniqueLists.sort((a, b) => {
                const aPinned = pinnedIds.has(a.id);
                const bPinned = pinnedIds.has(b.id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }));
        } catch (error) {
            console.error("Sidebar fetch error:", error);
        }
    };

    const renderListIcon = (icon: string) => {
        const isEmoji = icon && (/\p{Emoji_Presentation}/u.test(icon) || (icon.length <= 2 && /\p{Emoji}/u.test(icon)));
        const iconName: any = (!icon || isEmoji) ? "shopping-basket" : icon;
        return <FontAwesome name={iconName} size={14} color={COLORS.primary} style={{ marginRight: 10, width: 18, textAlign: 'center' }} />;
    };

    const navItems = [
        { name: "Home", icon: "home", path: "/(tabs)" },
        { name: "Settings", icon: "cog", path: "/(tabs)/settings" },
    ];

    if (Platform.OS !== "web") return null;

    return (
        <View style={{
            width: 260,
            height: "100%",
            backgroundColor: COLORS.white,
            borderRightWidth: 1,
            borderRightColor: COLORS.border,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            shadowColor: "#6BA0D8",
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
        }}>
            <View style={{ marginBottom: 40, paddingLeft: 4 }}>
                <Logo size={26} />
            </View>

            <View style={{ marginBottom: 32 }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path === "/(tabs)" && pathname === "/");
                    return (
                        <TouchableOpacity
                            key={item.name}
                            onPress={() => router.push(item.path)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 10,
                                backgroundColor: isActive ? COLORS.primarySoft : "transparent",
                                marginBottom: 6,
                            }}
                        >
                            <FontAwesome name={item.icon as any} size={16} color={isActive ? COLORS.primary : COLORS.textSecondary} style={{ width: 24, textAlign: 'center' }} />
                            <Text style={{
                                marginLeft: 8,
                                fontSize: 14,
                                fontWeight: isActive ? "700" : "500",
                                color: isActive ? COLORS.primary : COLORS.textSecondary,
                            }}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingHorizontal: 12
            }}>
                <Text style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: COLORS.text,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                }}>
                    My Lists
                </Text>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {lists.map((list) => {
                    const isActive = pathname.includes(`/list/${list.id}`);
                    return (
                        <TouchableOpacity
                            key={list.id}
                            onPress={() => router.push(`/list/${list.id}`)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: isActive ? COLORS.primarySoft : "transparent",
                                marginBottom: 4,
                            }}
                        >
                            {renderListIcon(list.icon)}
                            <Text style={{
                                flex: 1,
                                fontSize: 14,
                                fontWeight: isActive ? "700" : "500",
                                color: isActive ? COLORS.text : COLORS.textSecondary,
                            }} numberOfLines={1}>
                                {list.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={{ marginTop: "auto", paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                <TouchableOpacity
                    onPress={() => signOut()}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 8,
                    }}
                >
                    <FontAwesome name="sign-out" size={16} color={COLORS.textTertiary} style={{ width: 24, textAlign: 'center' }} />
                    <Text style={{ marginLeft: 8, color: COLORS.textTertiary, fontWeight: "600", fontSize: 14 }}>Sign out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
