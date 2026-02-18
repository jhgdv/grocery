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
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}
            >
                {/* Logo & Branding */}
                <View style={{ alignItems: "center", marginBottom: 48 }}>
                    <View style={{
                        height: 100,
                        width: 100,
                        backgroundColor: "white",
                        borderRadius: 35,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#8E8AFB",
                        shadowOpacity: 0.2,
                        shadowRadius: 20,
                        shadowOffset: { width: 0, height: 10 },
                        marginBottom: 24
                    }}>
                        <Logo size={60} showText={false} />
                    </View>

                    <Text style={{
                        fontSize: 42,
                        fontWeight: "900",
                        color: "#000000",
                        letterSpacing: -1,
                        marginBottom: 12
                    }}>
                        Grocery
                    </Text>
                    <Text style={{
                        color: "#71717A",
                        textAlign: "center",
                        fontSize: 17,
                        fontWeight: "500",
                        lineHeight: 24,
                        paddingHorizontal: 20
                    }}>
                        Stay organized & share lists with your favorite people.
                    </Text>
                </View>

                {/* Form */}
                <View>
                    {errorMessage ? (
                        <View style={{
                            backgroundColor: "#FFF1F1",
                            borderWidth: 1,
                            borderColor: "#FF7E7320",
                            borderRadius: 20,
                            padding: 16,
                            marginBottom: 24
                        }}>
                            <Text style={{ color: "#FF7E73", fontSize: 14, fontWeight: "700", textAlign: "center" }}>
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    <View style={{ marginBottom: 16 }}>
                        <TextInput
                            style={{
                                width: "100%",
                                backgroundColor: "white",
                                paddingHorizontal: 24,
                                paddingVertical: 20,
                                borderRadius: 24,
                                fontSize: 17,
                                fontWeight: "600",
                                color: "#000000",
                                shadowColor: "#000",
                                shadowOpacity: 0.04,
                                shadowRadius: 12,
                                elevation: 2,
                                borderWidth: 1,
                                borderColor: "rgba(0,0,0,0.03)"
                            }}
                            placeholder="Full Name"
                            placeholderTextColor="#A1A1AA"
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={{ marginBottom: 32 }}>
                        <TextInput
                            style={{
                                width: "100%",
                                backgroundColor: "white",
                                paddingHorizontal: 24,
                                paddingVertical: 20,
                                borderRadius: 24,
                                fontSize: 17,
                                fontWeight: "600",
                                color: "#000000",
                                shadowColor: "#000",
                                shadowOpacity: 0.04,
                                shadowRadius: 12,
                                elevation: 2,
                                borderWidth: 1,
                                borderColor: "rgba(0,0,0,0.03)"
                            }}
                            placeholder="Email Address"
                            placeholderTextColor="#A1A1AA"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <Pressable
                        onPress={handleSendCode}
                        disabled={loading}
                        style={({ pressed }) => ({
                            width: "100%",
                            backgroundColor: pressed ? "#E66B61" : "#FF7E73",
                            paddingVertical: 20,
                            borderRadius: 24,
                            alignItems: "center",
                            shadowColor: "#FF7E73",
                            shadowOpacity: 0.3,
                            shadowRadius: 15,
                            shadowOffset: { width: 0, height: 8 },
                            opacity: loading ? 0.7 : 1,
                        })}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontWeight: "800", fontSize: 18, letterSpacing: 1 }}>
                                Continue
                            </Text>
                        )}
                    </Pressable>

                    <Text style={{ textAlign: "center", color: "#A1A1AA", fontSize: 14, marginTop: 24, fontWeight: "600" }}>
                        We'll send you a secure 6-digit code.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
