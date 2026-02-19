import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Logo } from "../../components/Logo";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const COLORS = {
    bg: "#F4F6FC",
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primaryLight: "#91BBE6",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    accent: "#B39DDB",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    borderLight: "#EEF3FA",
    danger: "#E58A8A",
};

export default function Login() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    const handleSendCode = async () => {
        setErrorMessage("");

        if (!fullName.trim() || !email.trim()) {
            setErrorMessage("Please fill in all fields.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setErrorMessage("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    data: {
                        full_name: fullName.trim(),
                    },
                },
            });

            setLoading(false);

            if (error) {
                if (error.status === 429) {
                    setErrorMessage("Too many requests. Please try again in 60 seconds.");
                } else {
                    setErrorMessage(error.message);
                }
            } else {
                router.push({
                    pathname: "/(auth)/verify",
                    params: { email: email.trim() },
                });
            }
        } catch (err: any) {
            setLoading(false);
            setErrorMessage("Something went wrong. Please try again.");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
            >
                <View style={{ alignItems: "center", marginBottom: 40 }}>
                    <View style={{
                        width: 88,
                        height: 88,
                        borderRadius: 24,
                        backgroundColor: COLORS.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24,
                        borderWidth: 1.5,
                        borderColor: "rgba(107, 160, 216, 0.2)",
                    }}>
                        <Logo size={52} />
                    </View>
                    <Text style={{
                        fontSize: 28,
                        fontWeight: "800",
                        color: "#1E3A6E",
                        marginBottom: 8,
                        letterSpacing: 2,
                    }}>
                        LYST
                    </Text>
                    <Text style={{
                        fontSize: 15,
                        color: COLORS.textSecondary,
                        fontWeight: "500",
                        textAlign: "center",
                    }}>
                        Sign in to manage your lists
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
                    {errorMessage ? (
                        <View style={{ 
                            backgroundColor: "rgba(239, 68, 68, 0.1)", 
                            padding: 14, 
                            borderRadius: 10, 
                            marginBottom: 20,
                            borderWidth: 1,
                            borderColor: "rgba(239, 68, 68, 0.2)",
                        }}>
                            <Text style={{ 
                                color: COLORS.danger, 
                                fontSize: 14, 
                                fontWeight: "600", 
                                textAlign: "center",
                            }}>
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    <View style={{ marginBottom: 18 }}>
                        <Text style={{ 
                            fontSize: 13, 
                            fontWeight: "700", 
                            color: COLORS.textSecondary, 
                            marginBottom: 8, 
                            textTransform: 'uppercase', 
                            letterSpacing: 0.5,
                        }}>
                            Full Name
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: COLORS.bg,
                                padding: 16,
                                borderRadius: 12,
                                fontSize: 16,
                                color: COLORS.text,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                            placeholder="John Doe"
                            placeholderTextColor={COLORS.textTertiary}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ 
                            fontSize: 13, 
                            fontWeight: "700", 
                            color: COLORS.textSecondary, 
                            marginBottom: 8, 
                            textTransform: 'uppercase', 
                            letterSpacing: 0.5,
                        }}>
                            Email Address
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: COLORS.bg,
                                padding: 16,
                                borderRadius: 12,
                                fontSize: 16,
                                color: COLORS.text,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                            }}
                            placeholder="name@company.com"
                            placeholderTextColor={COLORS.textTertiary}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSendCode}
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
                                Continue
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={{ 
                    textAlign: "center", 
                    marginTop: 32, 
                    fontSize: 13, 
                    color: COLORS.textTertiary, 
                    fontWeight: "500",
                }}>
                    Secured by Supabase Authentication
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
