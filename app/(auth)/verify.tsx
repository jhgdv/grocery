import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { palette, typeStyles } from "../../lib/design";
import { supabase } from "../../lib/supabase";

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 4) {
      Alert.alert("Code", "Please enter the verification code.");
      return;
    }

    setLoading(true);

    const result = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    setLoading(false);

    if (result.error) {
      Alert.alert("Invalid code", result.error.message || "Please try again.");
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            width: 42,
            height: 42,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.line,
            backgroundColor: "rgba(255,255,255,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FontAwesome name="arrow-left" size={16} color={palette.text} />
        </TouchableOpacity>

        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <AnimatedGradientText
            text="Verify your code"
            style={typeStyles.h2}
            colors={["#F9F4F2", "#a3a3a3", "#F9F4F2"]}
          />
          <Text style={[typeStyles.body, { marginTop: 4, textAlign: "center" }]}>We sent a 6-digit code to {email}</Text>
        </View>

        <GlassCard style={{ padding: 16 }}>
          <Text style={[typeStyles.label, { textAlign: "center" }]}>Code</Text>
          <View style={{ marginTop: 8, borderRadius: 13, borderWidth: 1, borderColor: palette.line, backgroundColor: "rgba(255,255,255,0.55)" }}>
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              textAlign="center"
              style={{
                width: "100%",
                minHeight: 58,
                paddingHorizontal: 0,
                color: palette.text,
                fontSize: 32,
                fontWeight: "700",
                letterSpacing: 8,
                textAlignVertical: "center",
                fontVariant: ["tabular-nums"],
              }}
              autoFocus
              onSubmitEditing={handleVerify}
            />
          </View>

          <View style={{ marginTop: 14 }}>
            <LiquidButton onPress={handleVerify} label={loading ? "Verifying..." : "Verify"} icon="check" size="lg" disabled={loading} />
          </View>

          {loading ? (
            <View style={{ alignItems: "center", marginTop: 10 }}>
              <ActivityIndicator color={palette.text} />
            </View>
          ) : null}
        </GlassCard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
