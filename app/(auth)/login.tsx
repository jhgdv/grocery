import React, { useState } from "react";
import { View, Text, TextInput, Pressable, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Logo } from "../../components/Logo";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    const handleSendCode = async () => {
        setErrorMessage("");

        if (!fullName.trim()) {
            setErrorMessage("Please enter your name.");
            return;
        }

        if (!email.trim()) {
            setErrorMessage("Please enter your email address.");
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
                if (error.message.toLowerCase().includes("rate") || error.status === 429) {
                    setErrorMessage("Please wait — try again in 60 seconds.");
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
            if (err?.message?.toLowerCase().includes("rate")) {
                setErrorMessage("Please wait — try again in 60 seconds.");
            } else {
                setErrorMessage(err?.message || "Something went wrong. Please try again.");
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center px-8"
            >
                {/* Logo & Branding */}
                <View className="items-center mb-10">
                    <Logo size={80} />
                    <View style={{ height: 16 }} />
                    <Text className="text-4xl font-bold text-primary dark:text-white mb-2 tracking-tight">
                        Grocery
                    </Text>
                    <Text className="text-text-secondary dark:text-gray-400 text-center font-medium text-base">
                        Create, share & never forget a thing.
                    </Text>
                </View>

                {/* Form */}
                <View>
                    {/* Inline error */}
                    {errorMessage ? (
                        <View style={{ backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
                            <Text style={{ color: "#dc2626", fontSize: 14, fontWeight: "500", textAlign: "center" }}>
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    <View style={{ marginBottom: 16 }}>
                        <Text className="text-primary dark:text-gray-300 mb-2 font-semibold ml-1">First Name</Text>
                        <TextInput
                            style={{ width: "100%", backgroundColor: "#f8fdf9", paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", fontSize: 16, color: "#1c2321" }}
                            placeholder="Name"
                            placeholderTextColor="#9ca3af"
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={{ marginBottom: 16 }}>
                        <Text className="text-primary dark:text-gray-300 mb-2 font-semibold ml-1">Email Address</Text>
                        <TextInput
                            style={{ width: "100%", backgroundColor: "#f8fdf9", paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", fontSize: 16, color: "#1c2321" }}
                            placeholder="email@example.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Pressable */}
                    <Pressable
                        onPress={handleSendCode}
                        disabled={loading}
                        style={({ pressed }) => ({
                            width: "100%",
                            backgroundColor: pressed ? "#c4685f" : "#D97D73",
                            paddingVertical: 16,
                            borderRadius: 16,
                            alignItems: "center" as const,
                            marginTop: 8,
                            opacity: loading ? 0.6 : 1,
                            cursor: "pointer" as any,
                        })}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontWeight: "700", fontSize: 18, letterSpacing: 0.5 }}>
                                Continue with Email
                            </Text>
                        )}
                    </Pressable>

                    <Text style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 16 }}>
                        We'll send you a secure 6-digit code.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
