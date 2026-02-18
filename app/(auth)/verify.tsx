import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center px-8"
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-14 left-8 z-10 p-2 bg-surface-light dark:bg-surface-dark rounded-full shadow-sm"
                >
                    <Text className="text-primary dark:text-white">←</Text>
                </TouchableOpacity>

                <View className="items-center mb-10">
                    <Text className="text-3xl font-bold text-primary dark:text-white mb-2">
                        Check your email
                    </Text>
                    <Text className="text-text-secondary dark:text-gray-400 text-center text-base">
                        We sent a code to <Text className="font-bold text-primary dark:text-white">{email}</Text>
                    </Text>
                </View>

                <View className="space-y-6">
                    <View>
                        <Text className="text-primary dark:text-gray-300 mb-2 font-semibold ml-1 text-center">Enter Code</Text>
                        <TextInput
                            className="w-full bg-surface-light dark:bg-surface-dark px-6 py-5 rounded-2xl border border-accent dark:border-accent text-primary dark:text-white text-3xl font-bold text-center tracking-widest shadow-sm"
                            placeholder="000000"
                            placeholderTextColor="#cbd5e1"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={8}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        className="w-full bg-accent py-4 rounded-2xl items-center mt-4 shadow-lg shadow-accent/40"
                        onPress={handleVerify}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wide">Verify Code</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4"
                    >
                        <Text className="text-center text-primary dark:text-gray-400 font-medium">
                            Change email or resend
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
