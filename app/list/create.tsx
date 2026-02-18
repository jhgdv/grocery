import React, { useState } from "react";
import { View, Text, TextInput, Pressable, SafeAreaView, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";

export default function CreateList() {
    const router = useRouter();
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState("🛒");

    const ICONS = [
        // General Shopping
        "🛒", "🛍️", "🏪", "🏬", "🏢", "🏷️", "💳",
        // Spanish Supermarkets & General Staples
        "🥦", "🥩", "🍞", "🥛", "🧀", "🥚", // Mercadona / Lidl / Consum vibes
        "🍕", "🍔", "🥗", "🥘", "🥐", "🍷", "🍺",
        // Supermarket Specific (Represented by colors)
        "🟢", "🟡", "🔴", "🔵", "🟠", // Mercadona green, Lidl/Aldi colors
        // Fashion (Zara, Bershka, SHEIN)
        "👕", "👗", "👠", "👞", "👟", "👜", "🕶️", "💄", "💍", "👙", "🧤",
        // Home & Electronics (IKEA, Amazon, Tech)
        "🛋️", "🪑", "🛏️", "🚿", "🛠️", "🪴", "🪜", "🕯️", "📦", "🚚", "💻", "📱", "🎮", "🎧",
        // Travel & Online (AliExpress, Temu, Travel)
        "✈️", "🌍", "🗺️", "🧳", "🎟️", "🚢", "🚗", "🚲",
        // Life & Pets
        "💊", "🎁", "🎉", "💼", "🐶", "🐱", "🎈", "🎨", "📚", "🏀", "🎸"
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
            <View style={{ flex: 1, paddingHorizontal: 24 }}>
                <View style={{ paddingTop: 24, marginBottom: 32 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
                            <FontAwesome name="arrow-left" size={20} color="#1f2937" />
                        </Pressable>
                        <Text style={{ fontSize: 24, fontWeight: "800", marginLeft: 16, color: "#1f2937" }}>New List</Text>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ marginBottom: 12, color: "#71717A", fontWeight: "600" }}>List name</Text>
                        <TextInput
                            style={{
                                backgroundColor: "rgba(255,255,255,0.4)",
                                padding: 20,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.5)",
                                fontSize: 18,
                                color: "#000000",
                                fontWeight: "600"
                            }}
                            placeholder="e.g. Groceries"
                            placeholderTextColor="#A1A1AA"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    <Text style={{ marginBottom: 12, color: "#71717A", fontWeight: "600" }}>Choose Icon</Text>
                    <View style={{
                        flex: 1,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 32,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.3)",
                        overflow: "hidden",
                        // @ts-ignore
                        backdropFilter: "blur(20px)"
                    }}>
                        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={true}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start" }}>
                                {ICONS.map((icon, idx) => (
                                    <Pressable
                                        key={`${icon}-${idx}`}
                                        onPress={() => setSelectedIcon(icon)}
                                        style={{
                                            height: 52,
                                            width: 52,
                                            borderRadius: 20,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderWidth: 2,
                                            borderColor: selectedIcon === icon ? "#FF7E73" : "transparent",
                                            backgroundColor: selectedIcon === icon ? "#FF7E7315" : "rgba(255,255,255,0.4)",
                                        }}
                                    >
                                        <Text style={{ fontSize: 26 }}>{icon}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Create Button */}
                    <Pressable
                        onPress={handleCreate}
                        disabled={loading || !name.trim()}
                        style={({ pressed }) => ({
                            paddingVertical: 20,
                            borderRadius: 24,
                            alignItems: "center" as const,
                            backgroundColor: (!name.trim() || loading) ? "#E5E7EB" : "#FF7E73",
                            shadowColor: "#FF7E73",
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: (!name.trim() || loading) ? 0 : 0.3,
                            shadowRadius: 15,
                            marginBottom: 40
                        })}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>Create List</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
