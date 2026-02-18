import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Share } from "react-native";
const isWeb = Platform.OS === "web";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Container } from "../../components/Container";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function InviteUser() {
    const router = useRouter();
    const { listId } = useLocalSearchParams<{ listId: string }>();
    const { user } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [listName, setListName] = useState("a list");
    const [isInvited, setIsInvited] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        const fetchListName = async () => {
            const { data } = await supabase.from("lists").select("name").eq("id", listId).single();
            if (data?.name) setListName(data.name);
        };
        if (listId) fetchListName();
    }, [listId]);

    const handleInvite = async () => {
        setStatusMessage(null);
        if (!email || !email.includes("@")) {
            setStatusMessage({ type: 'error', text: "Please enter a valid email address." });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from("list_shares")
                .insert([
                    {
                        list_id: listId,
                        invited_email: email.trim().toLowerCase(),
                        status: 'pending',
                        invited_by: user?.id
                    }
                ]);

            if (error) {
                if (error.code === 'PGRST205' || error.message.includes('not found')) {
                    throw new Error("Database table 'list_shares' not found. You MUST run the SQL script in your Supabase dashboard first.");
                }
                throw error;
            }

            setStatusMessage({ type: 'success', text: `Invite stored for ${email}! They can now join by logging in.` });
            setIsInvited(true);
            // Don't clear email immediately so WhatsApp can use it
        } catch (error: any) {
            setStatusMessage({ type: 'error', text: error.message || "Could not send invite." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 16,
                flexDirection: "row",
                alignItems: "center"
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        height: 48,
                        width: 48,
                        borderRadius: 24,
                        backgroundColor: "white",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2
                    }}
                >
                    <FontAwesome name="chevron-left" size={16} color="#000000" />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, fontWeight: "800", color: "#000000", marginLeft: 16 }}>Share List</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, paddingHorizontal: 32 }}
            >
                <View style={{ alignItems: "center", marginBottom: 40, marginTop: 24 }}>
                    <View style={{
                        height: 100,
                        width: 100,
                        backgroundColor: "#8E8AFB15",
                        borderRadius: 35,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24
                    }}>
                        <FontAwesome name="envelope-o" size={40} color="#8E8AFB" />
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: "900", color: "#000000", marginBottom: 12, textAlign: "center" }}>
                        Invite Someone
                    </Text>
                    <Text style={{ color: "#71717A", textAlign: "center", fontSize: 17, fontWeight: "500", lineHeight: 24 }}>
                        Share this list with others to edit and check items together in real-time.
                    </Text>
                </View>

                <View>
                    {statusMessage && (
                        <View style={{
                            backgroundColor: statusMessage.type === 'error' ? '#FFF1F1' : '#F0FDF4',
                            padding: 20,
                            borderRadius: 24,
                            marginBottom: 24,
                            borderWidth: 1,
                            borderColor: statusMessage.type === 'error' ? '#FF7E7320' : '#22C55E20'
                        }}>
                            <Text style={{ color: statusMessage.type === 'error' ? '#FF7E73' : '#16A34A', fontWeight: '800', textAlign: 'center' }}>
                                {statusMessage.text}
                            </Text>
                        </View>
                    )}

                    <Text style={{ color: "#000000", fontSize: 13, fontWeight: "800", marginBottom: 10, marginLeft: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>Email Address</Text>
                    <TextInput
                        style={{
                            backgroundColor: "white",
                            paddingHorizontal: 24,
                            paddingVertical: 20,
                            borderRadius: 24,
                            fontSize: 18,
                            color: "#000000",
                            fontWeight: "600",
                            marginBottom: 32,
                            shadowColor: "#000",
                            shadowOpacity: 0.05,
                            shadowRadius: 10,
                            elevation: 2
                        }}
                        placeholder="friend@example.com"
                        placeholderTextColor="#A1A1AA"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoFocus
                    />

                    <Pressable
                        onPress={handleInvite}
                        disabled={loading || !email}
                        style={({ pressed }) => ({
                            width: "100%",
                            paddingVertical: 20,
                            borderRadius: 24,
                            alignItems: "center",
                            backgroundColor: (!email || loading) ? "#E5E5EA" : pressed ? "#7C77E6" : "#8E8AFB",
                            shadowColor: "#8E8AFB",
                            shadowOpacity: (!email || loading) ? 0 : 0.3,
                            shadowRadius: 15,
                            shadowOffset: { width: 0, height: 8 },
                            marginBottom: 20
                        })}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontWeight: "800", fontSize: 18, letterSpacing: 1 }}>Send Invite</Text>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={async () => {
                            const baseUrl = Platform.OS === 'web' ? window.location.origin : 'https://grocery-app.vercel.app';
                            const msg = `Hey! I shared the list "${listName}" with you. Log in with your email ${email} to collaborate: ${baseUrl}`;

                            try {
                                if (Platform.OS === 'web') {
                                    if (navigator.share) {
                                        await navigator.share({
                                            title: `Grocery List: ${listName}`,
                                            text: msg,
                                            url: baseUrl,
                                        });
                                    } else {
                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                    }
                                } else {
                                    await Share.share({
                                        message: msg,
                                        url: baseUrl,
                                    });
                                }
                            } catch (e) {
                                console.log("Sharing failed", e);
                            }
                        }}
                        style={({ pressed }) => ({
                            width: "100%",
                            paddingVertical: 18,
                            borderRadius: 24,
                            alignItems: "center",
                            backgroundColor: pressed ? "rgba(34, 197, 94, 0.05)" : "transparent",
                            borderWidth: 2,
                            borderColor: isInvited ? "#22C55E" : "#E5E5EA",
                            opacity: isInvited ? (pressed ? 0.7 : 1) : 0.5
                        })}
                        disabled={!isInvited}
                    >
                        <Text style={{ color: isInvited ? "#166534" : "#A1A1AA", fontWeight: "800", fontSize: 16 }}>
                            {isInvited ? "Share via WhatsApp / App" : "Invite email first..."}
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
