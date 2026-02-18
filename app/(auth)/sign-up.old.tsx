import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function SignUp() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);

        // 1. Sign up with Supabase Auth
        const { data: { session, user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: name,
                },
            },
        });

        if (error) {
            Alert.alert("Error", error.message);
            setLoading(false);
            return;
        }

        // 2. Trigger profile creation would happen here normally via DB trigger
        // or we can manually insert if public table allows it.
        // For now, we trust metadata or will handle profile init in Protected Route if missing.

        if (!session) {
            Alert.alert("Success", "Please check your email for verification!");
        }

        setLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <View className="flex-1 justify-center px-8">
                <View className="items-center mb-10">
                    <Text className="text-3xl font-bold text-primary dark:text-white mb-2">
                        Create Account
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400">
                        Join using your email address
                    </Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-primary dark:text-gray-200 mb-2 font-medium">Full Name</Text>
                        <TextInput
                            className="w-full bg-gray-100 dark:bg-surface-dark px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-primary dark:text-white"
                            placeholder="John Doe"
                            placeholderTextColor="#9ca3af"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View>
                        <Text className="text-primary dark:text-gray-200 mb-2 font-medium">Email</Text>
                        <TextInput
                            className="w-full bg-gray-100 dark:bg-surface-dark px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-primary dark:text-white"
                            placeholder="hello@example.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View>
                        <Text className="text-primary dark:text-gray-200 mb-2 font-medium">Password</Text>
                        <TextInput
                            className="w-full bg-gray-100 dark:bg-surface-dark px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-primary dark:text-white"
                            placeholder="••••••••"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-xl items-center mt-6 shadow-sm"
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-gray-500 dark:text-gray-400">
                            Already have an account?{" "}
                        </Text>
                        <Link href="/sign-in" asChild>
                            <TouchableOpacity>
                                <Text className="text-primary dark:text-blue-400 font-bold">
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
