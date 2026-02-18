import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [lists, setLists] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (user) {
            fetchLists();
        }
    }, [user]);

    const fetchLists = async () => {
        const { data } = await supabase
            .from("lists")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) setLists(data);
    };

    const navItems = [
        { name: "Home", icon: "home", path: "/(tabs)" },
        { name: "Settings", icon: "cog", path: "/(tabs)/settings" },
    ];

    if (Platform.OS !== "web") return null;

    return (
        <View style={{
            width: 280,
            height: "100%",
            backgroundColor: "white",
            borderRightWidth: 1,
            borderRightColor: "rgba(0,0,0,0.05)",
            padding: 24,
            display: "flex",
            flexDirection: "column"
        }}>
            <View style={{ marginBottom: 40 }}>
                <Logo size={36} />
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
                                borderRadius: 12,
                                backgroundColor: isActive ? "#FF7E7315" : "transparent",
                                marginBottom: 4
                            }}
                        >
                            <FontAwesome name={item.icon as any} size={18} color={isActive ? "#FF7E73" : "#71717A"} style={{ width: 24 }} />
                            <Text style={{
                                marginLeft: 8,
                                fontSize: 16,
                                fontWeight: isActive ? "700" : "500",
                                color: isActive ? "#FF7E73" : "#1f2937"
                            }}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#A1A1AA",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 16,
                paddingHorizontal: 16
            }}>
                My Lists
            </Text>

            <ScrollView style={{ flex: 1 }}>
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
                                borderRadius: 12,
                                backgroundColor: isActive ? "#FF7E7315" : "transparent",
                                marginBottom: 2
                            }}
                        >
                            <Text style={{ fontSize: 18, marginRight: 10 }}>{list.icon || "🛒"}</Text>
                            <Text style={{
                                flex: 1,
                                fontSize: 15,
                                fontWeight: isActive ? "700" : "500",
                                color: isActive ? "#000000" : "#4B5563"
                            }} numberOfLines={1}>
                                {list.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={{ marginTop: "auto", paddingTop: 24, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }}>
                <TouchableOpacity
                    onPress={() => signOut()}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 12
                    }}
                >
                    <FontAwesome name="sign-out" size={18} color="#71717A" style={{ width: 24 }} />
                    <Text style={{ marginLeft: 8, color: "#71717A", fontWeight: "600" }}>Log out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
