import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable } from "react-native";
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
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
            setEmail("");
        } catch (error: any) {
            setStatusMessage({ type: 'error', text: error.message || "Could not send invite." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
                <View className="px-6 pt-6 pb-4 flex-row items-center border-b border-gray-100 dark:border-gray-800">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <FontAwesome name="arrow-left" size={20} color="#1A2F2B" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-primary dark:text-white">Share List</Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 p-6"
                >
                    <View className="items-center mb-8 mt-4">
                        <View className="h-20 w-20 bg-accent/10 rounded-full items-center justify-center mb-4">
                            <FontAwesome name="envelope-o" size={32} color="#D97D73" />
                        </View>
                        <Text className="text-2xl font-bold text-primary dark:text-white mb-2">Invite Collaborators</Text>
                        <Text className="text-text-secondary dark:text-gray-400 text-center">
                            Share this list with others to edit and check items together in real-time.
                        </Text>
                    </View>

                    <View>
                        {statusMessage && (
                            <View style={{ backgroundColor: statusMessage.type === 'error' ? '#fef2f2' : '#f0fdf4', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: statusMessage.type === 'error' ? '#fecaca' : '#bbf7d0' }}>
                                <Text style={{ color: statusMessage.type === 'error' ? '#dc2626' : '#16a34a', fontWeight: '600', textAlign: 'center' }}>
                                    {statusMessage.text}
                                </Text>
                            </View>
                        )}

                        <Text style={{ color: "#374151", fontWeight: "700", marginBottom: 8, marginLeft: 4 }}>Email Address</Text>
                        <TextInput
                            style={{ backgroundColor: "rgba(255,255,255,0.8)", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(229,231,235,0.6)", fontSize: 18, color: "#1f2937", marginBottom: 24 }}
                            placeholder="friend@example.com"
                            placeholderTextColor="#9ca3af"
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
                                paddingVertical: 16,
                                borderRadius: 16,
                                alignItems: "center" as const,
                                backgroundColor: (!email || loading) ? "#d1d5db" : pressed ? "#D97D73" : "#D97D73",
                                opacity: (!email || loading) ? 0.6 : 1,
                                cursor: "pointer" as any,
                                marginBottom: 16
                            })}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: "white", fontWeight: "700", fontSize: 18 }}>Send Invite</Text>
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                const msg = `Hey! I invited you to my grocery list. Log in with ${email} to see it! http://localhost:8081`;
                                if (isWeb) {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                }
                            }}
                            style={({ pressed }) => ({
                                width: "100%",
                                paddingVertical: 16,
                                borderRadius: 16,
                                alignItems: "center" as const,
                                backgroundColor: "rgba(34, 197, 94, 0.1)",
                                borderWidth: 1,
                                borderColor: "#22c55e",
                                opacity: pressed ? 0.7 : 1,
                                cursor: "pointer" as any
                            })}
                        >
                            <Text style={{ color: "#166534", fontWeight: "700", fontSize: 16 }}>Share via WhatsApp</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Container>
    );
}
