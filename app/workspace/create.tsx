import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { useWorkspace } from "../../context/WorkspaceContext";
import { ACCENT_PINK, ACCENT_PURPLE, palette } from "../../lib/design";

export default function WorkspaceCreateScreen() {
  const router = useRouter();
  const { createWorkspace, inviteToWorkspace } = useWorkspace();

  const [step, setStep] = useState<"name" | "invite">("name");
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setLoading(true);
    setError(null);

    const result = await createWorkspace(workspaceName.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCreatedWorkspaceId(result.data?.id || null);
    setStep("invite");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!createdWorkspaceId) return;

    setLoading(true);
    setError(null);

    const result = await inviteToWorkspace(createdWorkspaceId, inviteEmail.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.back();
  };

  const isNameStep = step === "name";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 20 }}>
          {/* Header row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => (isNameStep ? router.back() : setStep("name"))}
              style={{
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

            {/* Progress dots */}
            <View style={{ flexDirection: "row", gap: 6, marginLeft: 14 }}>
              {[1, 2].map((n) => (
                <View
                  key={n}
                  style={{
                    width: n <= (isNameStep ? 1 : 2) ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: n <= (isNameStep ? 1 : 2) ? palette.accent : "rgba(21,21,21,0.15)",
                  }}
                />
              ))}
            </View>
          </View>

          {/* Main content */}
          <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>
            {isNameStep ? (
              <>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: palette.textMuted,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Step 1 of 2
                </Text>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "800",
                    color: palette.text,
                    letterSpacing: -0.7,
                    marginBottom: 8,
                  }}
                >
                  Give your workspace a name.
                </Text>
                <Text style={{ fontSize: 16, color: palette.textMuted, marginBottom: 40 }}>
                  This is how you and your team will find it.
                </Text>

                <TextInput
                  value={workspaceName}
                  onChangeText={(text) => {
                    setWorkspaceName(text);
                    setError(null);
                  }}
                  placeholder="e.g. Family, Roommates, Work"
                  placeholderTextColor={palette.textMuted}
                  autoFocus
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: palette.text,
                    borderBottomWidth: 2,
                    borderBottomColor: workspaceName.trim() ? palette.accent : palette.line,
                    paddingVertical: 14,
                    marginBottom: 40,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateWorkspace}
                />

                {error ? <Text style={{ color: palette.danger, marginBottom: 16, fontSize: 14 }}>{error}</Text> : null}

                <TouchableOpacity
                  onPress={handleCreateWorkspace}
                  disabled={!workspaceName.trim() || loading}
                  style={{
                    height: 56,
                    borderRadius: 28,
                    overflow: "hidden",
                    opacity: !workspaceName.trim() || loading ? 0.5 : 1,
                  }}
                >
                  <LinearGradient
                    colors={[ACCENT_PURPLE, ACCENT_PINK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Continue</Text>
                        <FontAwesome name="arrow-right" size={14} color="#fff" style={{ marginLeft: 10 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: palette.textMuted,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Step 2 of 2
                </Text>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "800",
                    color: palette.text,
                    letterSpacing: -0.7,
                    marginBottom: 8,
                  }}
                >
                  Invite someone to join.
                </Text>
                <Text style={{ fontSize: 16, color: palette.textMuted, marginBottom: 40 }}>
                  They'll get access to all lists in <Text style={{ color: palette.text, fontWeight: "700" }}>{workspaceName}</Text>.
                </Text>

                <TextInput
                  value={inviteEmail}
                  onChangeText={(text) => {
                    setInviteEmail(text);
                    setError(null);
                  }}
                  placeholder="partner@email.com"
                  placeholderTextColor={palette.textMuted}
                  autoFocus
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    fontSize: 22,
                    fontWeight: "600",
                    color: palette.text,
                    borderBottomWidth: 2,
                    borderBottomColor: inviteEmail.trim() ? palette.accent : palette.line,
                    paddingVertical: 14,
                    marginBottom: 40,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleInvite}
                />

                {error ? <Text style={{ color: palette.danger, marginBottom: 16, fontSize: 14 }}>{error}</Text> : null}

                <TouchableOpacity
                  onPress={handleInvite}
                  disabled={!inviteEmail.trim() || loading}
                  style={{
                    height: 56,
                    borderRadius: 28,
                    overflow: "hidden",
                    opacity: !inviteEmail.trim() || loading ? 0.5 : 1,
                    marginBottom: 14,
                  }}
                >
                  <LinearGradient
                    colors={[ACCENT_PURPLE, ACCENT_PINK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <FontAwesome name="user-plus" size={14} color="#fff" style={{ marginRight: 10 }} />
                        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>Send invite</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ height: 56, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: palette.textMuted, fontSize: 16, fontWeight: "600" }}>Skip for now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
