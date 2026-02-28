import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { GlassCard } from "../../components/GlassCard";
import { LiquidButton } from "../../components/LiquidButton";
import { AnimatedGradientText } from "../../components/AnimatedGradientText";
import { Logo } from "../../components/Logo";
import { palette, typeStyles } from "../../lib/design";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const emailInputRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);

  const handleContinue = async () => {
    setError(null);

    const emailTrimmed = email.trim().toLowerCase();

    if (!isLogin && !fullName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!emailTrimmed) {
      setError("Please enter your email.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const otpOptions = isLogin
      ? { email: emailTrimmed }
      : { email: emailTrimmed, options: { data: { full_name: fullName.trim() } } };

    const result = await supabase.auth.signInWithOtp(otpOptions);

    setLoading(false);

    if (result.error) {
      if (result.error.status === 429) {
        setError("Too many requests. Please try again in 1 minute.");
      } else {
        setError(result.error.message);
      }
      return;
    }

    router.push({ pathname: "/(auth)/verify", params: { email: emailTrimmed } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <Logo size={62} />
          <AnimatedGradientText
            text="Shared lists, real-time"
            style={[typeStyles.h2, { marginTop: 14 }]}
            colors={["#F9F4F2", "#a3a3a3", "#F9F4F2"]}
          />
          <Text style={[typeStyles.body, { marginTop: 4 }]}>Sign in with an email code</Text>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 4 }}>
          <TouchableOpacity
            onPress={() => setIsLogin(true)}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: isLogin ? "rgba(255,255,255,0.25)" : "transparent", borderRadius: 10 }}
          >
            <Text style={{ color: isLogin ? palette.text : palette.textMuted, fontWeight: "600", fontSize: 15 }}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsLogin(false)}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: !isLogin ? "rgba(255,255,255,0.25)" : "transparent", borderRadius: 10 }}
          >
            <Text style={{ color: !isLogin ? palette.text : palette.textMuted, fontWeight: "600", fontSize: 15 }}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={{ padding: 16 }}>
          {!isLogin && (
            <>
              <Text style={typeStyles.label}>Name</Text>
              <View style={{ marginTop: 8, borderRadius: 13, borderWidth: 1, borderColor: palette.line, backgroundColor: "rgba(255,255,255,0.55)" }}>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor={palette.textMuted}
                  style={{ minHeight: 48, paddingHorizontal: 13, color: palette.text, fontSize: 16 }}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              </View>
            </>
          )}

          <Text style={[typeStyles.label, { marginTop: !isLogin ? 14 : 0 }]}>Email</Text>
          <View style={{ marginTop: 8, borderRadius: 13, borderWidth: 1, borderColor: palette.line, backgroundColor: "rgba(255,255,255,0.55)" }}>
            <TextInput
              ref={emailInputRef}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ minHeight: 48, paddingHorizontal: 13, color: palette.text, fontSize: 16 }}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          {error ? (
            <View style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: "rgba(197,48,48,0.12)" }}>
              <Text style={{ color: palette.danger, fontWeight: "600", fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 14 }}>
            <LiquidButton onPress={handleContinue} icon="arrow-right" label={loading ? "Sending..." : "Continue"} size="lg" disabled={loading} />
          </View>

          {loading ? (
            <View style={{ alignItems: "center", marginTop: 10 }}>
              <ActivityIndicator color={palette.text} />
            </View>
          ) : null}
        </GlassCard>

        <TouchableOpacity onPress={() => emailInputRef.current?.focus()} style={{ marginTop: 16 }}>
          <Text style={{ textAlign: "center", color: palette.textMuted }}>Use the same email your partner will use for invites.</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
