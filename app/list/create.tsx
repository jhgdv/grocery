import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";

const COLORS = {
    bg: "#F4F6FC",
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    accent: "#B39DDB",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    borderLight: "#EEF3FA",
};

export default function CreateList() {
    const router = useRouter();
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState("list");

    const ICONS = [
        "list", "check-square-o", "bookmark", "star", "heart",
        "gift", "shopping-cart", "shopping-basket", "cutlery", "coffee",
        "home", "briefcase", "plane", "car", "map-marker",
        "music", "camera", "book", "lightbulb-o", "paint-brush",
        "birthday-cake", "paw", "fire", "bell", "tag",
        "leaf", "bicycle", "medkit", "beer", "snowflake-o",
    ];

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from("lists")
                .insert([{ name: name.trim(), user_id: user?.id, icon: selectedIcon }]);
            if (error) throw error;
            router.back();
        } catch (error: any) {
            console.log("Error creating list", error);
            Alert.alert("Error", "Could not create list.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {/* Header */}
                <View style={{ paddingTop: 20, marginBottom: 24 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={{
                                padding: 10,
                                backgroundColor: COLORS.white,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                        >
                            <FontAwesome name="arrow-left" size={18} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={{ 
                            fontSize: 22, 
                            fontWeight: "800", 
                            marginLeft: 16, 
                            color: COLORS.text,
                        }}>
                            New List
                        </Text>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ 
                            marginBottom: 10, 
                            color: COLORS.textSecondary, 
                            fontWeight: "800", 
                            fontSize: 12, 
                            textTransform: 'uppercase', 
                            letterSpacing: 0.5,
                        }}>
                            List name
                        </Text>
                        <View style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                        }}>
                            <TextInput
                                style={{
                                    padding: 18,
                                    fontSize: 16,
                                    color: COLORS.text,
                                    fontWeight: "600",
                                }}
                                placeholder="e.g. Weekly groceries"
                                placeholderTextColor={COLORS.textTertiary}
                                value={name}
                                onChangeText={setName}
                                autoFocus
                            />
                        </View>
                    </View>

                    <Text style={{ 
                        marginBottom: 12, 
                        color: COLORS.textSecondary, 
                        fontWeight: "800", 
                        fontSize: 12, 
                        textTransform: 'uppercase', 
                        letterSpacing: 0.5,
                    }}>
                        Choose Icon
                    </Text>
                    
                    <View style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        padding: 16,
                        marginBottom: 24,
                    }}>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "flex-start" }}>
                            {ICONS.map((icon, idx) => (
                                <TouchableOpacity
                                    key={`${icon}-${idx}`}
                                    onPress={() => setSelectedIcon(icon)}
                                    style={{
                                        height: 52,
                                        width: 52,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 2,
                                        borderColor: selectedIcon === icon ? COLORS.primary : COLORS.border,
                                        backgroundColor: selectedIcon === icon ? COLORS.primarySoft : COLORS.white,
                                    }}
                                >
                                    <FontAwesome
                                        name={icon as any}
                                        size={22}
                                        color={selectedIcon === icon ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Create Button */}
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={loading || !name.trim()}
                        style={{
                            paddingVertical: 18,
                            borderRadius: 14,
                            alignItems: "center",
                            backgroundColor: (!name.trim() || loading) ? COLORS.border : COLORS.primary,
                            // @ts-ignore
                            background: (!name.trim() || loading) ? COLORS.border : 'linear-gradient(135deg, #6BA0D8 0%, #B39DDB 100%)',
                            marginBottom: 40,
                            shadowColor: "#8A9FD8",
                            shadowOffset: { width: 0, height: 5 },
                            shadowOpacity: (!name.trim() || loading) ? 0 : 0.35,
                            shadowRadius: 14,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ 
                                color: "white", 
                                fontWeight: "700", 
                                fontSize: 16,
                            }}>
                                Create List
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
