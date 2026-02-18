import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

export default function Verify() {
    const { email } = useLocalSearchParams<{ email: string }>();
    // We use an array for the 6 digits if we want individual boxes, but for simplicity let's stick to one main input first 
    // or implement a simple single input that looks good.
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        // Allow flexible OTP lengths (typically 6, but sometimes 4 or 8)
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
        } else {
            // AuthContext will handle the redirect
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        position: "absolute",
                        top: 60,
                        left: 24,
                        zIndex: 10,
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

                <View style={{ alignItems: "center", marginBottom: 48 }}>
                    <Text style={{ fontSize: 36, fontWeight: "900", color: "#000000", marginBottom: 12, textAlign: "center" }}>
                        Confirm it's you
                    </Text>
                    <Text style={{ color: "#71717A", textAlign: "center", fontSize: 17, fontWeight: "500", lineHeight: 24 }}>
                        We've sent a code to{"\n"}
                        <Text style={{ fontWeight: "800", color: "#8E8AFB" }}>{email}</Text>
                    </Text>
                </View>

                <View>
                    <View style={{ marginBottom: 32 }}>
                        <TextInput
                            style={{
                                width: "100%",
                                backgroundColor: "white",
                                paddingVertical: 24,
                                borderRadius: 28,
                                textAlign: "center",
                                fontSize: 36,
                                fontWeight: "800",
                                color: "#000000",
                                letterSpacing: 8,
                                shadowColor: "#8E8AFB",
                                shadowOpacity: 0.1,
                                shadowRadius: 20,
                                shadowOffset: { width: 0, height: 10 },
                                elevation: 5,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.8)"
                            }}
                            placeholder="000000"
                            placeholderTextColor="#E5E5EA"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={8}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={{
                            width: "100%",
                            backgroundColor: "#8E8AFB",
                            paddingVertical: 20,
                            borderRadius: 24,
                            alignItems: "center",
                            shadowColor: "#8E8AFB",
                            shadowOpacity: 0.3,
                            shadowRadius: 15,
                            shadowOffset: { width: 0, height: 8 },
                            opacity: loading ? 0.7 : 1
                        }}
                        onPress={handleVerify}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontWeight: "800", fontSize: 18, letterSpacing: 1 }}>Verify Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginTop: 24 }}
                    >
                        <Text style={{ textAlign: "center", color: "#71717A", fontWeight: "700" }}>
                            Wrong email? <Text style={{ color: "#8E8AFB" }}>Try again</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
