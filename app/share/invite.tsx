import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { GlassCard } from "../../components/GlassCard";
import { LiquidButton } from "../../components/LiquidButton";
import { AnimatedGradientText } from "../../components/AnimatedGradientText";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { friendlyError, palette, typeStyles } from "../../lib/design";
import { supabase } from "../../lib/supabase";

export default function ShareInviteScreen() {
  const router = useRouter();
  const { workspaceId, listId } = useLocalSearchParams<{ workspaceId?: string; listId?: string }>();
  const { user } = useAuth();
  const { inviteToWorkspace } = useWorkspace();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetName, setTargetName] = useState("workspace");
  const [message, setMessage] = useState<string | null>(null);

  const isWorkspaceInvite = !!workspaceId;

  useEffect(() => {
    const fetchTarget = async () => {
      if (workspaceId) {
        const workspaceRes = await supabase.from("workspaces").select("name").eq("id", workspaceId).single();
        if (!workspaceRes.error && workspaceRes.data?.name) {
          setTargetName(workspaceRes.data.name);
          return;
        }
      }

      if (listId) {
        const listRes = await supabase.from("lists").select("name").eq("id", listId).single();
        if (!listRes.error && listRes.data?.name) {
          setTargetName(listRes.data.name);
        }
      }
    };

    fetchTarget();
  }, [workspaceId, listId]);

  const shareCopy = useMemo(() => {
    const appUrl = process.env.EXPO_PUBLIC_APP_URL || "https://grocery-app.vercel.app";
    const scope = isWorkspaceInvite ? "workspace" : "list";
    return `You're invited to ${scope}: ${targetName}. Open LYST: ${appUrl}`;
  }, [isWorkspaceInvite, targetName]);

  const handleInvite = async () => {
    setMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!user) {
      setMessage("You are not signed in.");
      return;
    }

    setLoading(true);

    try {
      if (isWorkspaceInvite && workspaceId) {
        const workspaceInviteRes = await inviteToWorkspace(workspaceId, email);
        if (workspaceInviteRes.error) throw new Error(workspaceInviteRes.error);
      } else {
        if (!listId) throw new Error("No list selected.");

        const insertRes = await supabase.from("list_shares").upsert([
          {
            list_id: listId,
            invited_email: email.trim().toLowerCase(),
            invited_by: user.id,
            status: "pending",
          },
        ]);

        if (insertRes.error) throw insertRes.error;
      }

      setMessage(`Invitation sent to ${email.toLowerCase().trim()}.`);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(shareCopy);
          Alert.alert("Copied", "Invite text copied to clipboard.");
        }
        return;
      }

      await Share.share({ message: shareCopy });
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 18, flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: "rgba(255,255,255,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome name="arrow-left" size={16} color={palette.text} />
            </TouchableOpacity>
            <AnimatedGradientText
              text="Invite"
              style={[typeStyles.h2, { marginLeft: 12 }]}
              colors={["#7366F6", "#F472B6", "#7366F6"]}
            />
          </View>

          <GlassCard style={{ padding: 16, marginBottom: 12 }}>
            <Text style={typeStyles.label}>{isWorkspaceInvite ? "Workspace" : "List"}</Text>
            <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700", marginTop: 8 }}>{targetName}</Text>
            <Text style={[typeStyles.body, { marginTop: 6 }]}>Invite your partner so you can edit and check off items together in real-time.</Text>
          </GlassCard>

          <GlassCard style={{ padding: 16, marginBottom: 12 }}>
            <Text style={typeStyles.label}>Email</Text>
            <View
              style={{
                marginTop: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.line,
                backgroundColor: "rgba(255,255,255,0.55)",
              }}
            >
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="partner@email.com"
                placeholderTextColor={palette.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ minHeight: 48, paddingHorizontal: 14, color: palette.text, fontSize: 16 }}
              />
            </View>

            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
              <LiquidButton
                onPress={handleInvite}
                icon="user-plus"
                label={loading ? "Sending..." : "Send invite"}
                disabled={loading || !email.trim()}
              />
              <LiquidButton onPress={handleShare} icon="share-alt" label="Share link" variant="secondary" />
            </View>

            {loading ? (
              <View style={{ marginTop: 10, alignItems: "center" }}>
                <ActivityIndicator color={palette.text} />
              </View>
            ) : null}

            {message ? (
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "rgba(21,21,21,0.08)",
                }}
              >
                <Text style={{ color: palette.textSoft }}>{message}</Text>
              </View>
            ) : null}
          </GlassCard>

          <Text style={[typeStyles.body, { textAlign: "center", marginTop: 6 }]}>Realtime updates are active via Supabase channels.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
