import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

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

export default function Verify() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        if (code.length < 4 || code.length > 8) {
            Alert.alert("Error", "Please enter a valid code");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: "email",
        });

        setLoading(false);

        if (error) {
            Alert.alert("Invalid Code", "Please check the code and try again.");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        position: "absolute",
                        top: 40,
                        left: 20,
                        zIndex: 10,
                        height: 48,
                        width: 48,
                        borderRadius: 12,
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <FontAwesome name="chevron-left" size={16} color={COLORS.text} />
                </TouchableOpacity>

                <View style={{ alignItems: "center", marginBottom: 40 }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        backgroundColor: COLORS.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: "rgba(14, 165, 233, 0.2)",
                    }}>
                        <FontAwesome name="lock" size={32} color={COLORS.primary} />
                    </View>
                    <Text style={{ 
                        fontSize: 26, 
                        fontWeight: "800", 
                        color: COLORS.text, 
                        marginBottom: 12, 
                        textAlign: "center",
                    }}>
                        Verify your email
                    </Text>
                    <Text style={{ 
                        color: COLORS.textSecondary, 
                        textAlign: "center", 
                        fontSize: 15, 
                        fontWeight: "500", 
                        lineHeight: 22,
                    }}>
                        We've sent a code to{"\n"}
                        <Text style={{ fontWeight: "700", color: COLORS.text }}>{email}</Text>
                    </Text>
                </View>

                <View style={{
                    backgroundColor: COLORS.white,
                    padding: 28,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 3,
                }}>
                    <View style={{ marginBottom: 24 }}>
                        <TextInput
                            style={{
                                width: "100%",
                                backgroundColor: COLORS.bg,
                                paddingVertical: 18,
                                borderRadius: 12,
                                textAlign: "center",
                                fontSize: 32,
                                fontWeight: "800",
                                color: COLORS.text,
                                letterSpacing: 8,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                            placeholder="000000"
                            placeholderTextColor={COLORS.textTertiary}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={loading}
                        style={{
                            backgroundColor: COLORS.primary,
                            // @ts-ignore
                            background: 'linear-gradient(135deg, #6BA0D8 0%, #B39DDB 100%)',
                            paddingVertical: 18,
                            borderRadius: 14,
                            alignItems: "center",
                            shadowColor: "#8A9FD8",
                            shadowOpacity: 0.35,
                            shadowRadius: 14,
                            shadowOffset: { width: 0, height: 5 },
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={{ 
                                color: "#ffffff", 
                                fontWeight: "700", 
                                fontSize: 16,
                            }}>
                                Verify Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginTop: 20 }}
                    >
                        <Text style={{ 
                            textAlign: "center", 
                            color: COLORS.textSecondary, 
                            fontWeight: "600", 
                            fontSize: 14,
                        }}>
                            Wrong email? <Text style={{ color: COLORS.text, fontWeight: "700" }}>Try again</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
