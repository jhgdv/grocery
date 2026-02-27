import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "../../components/GlassCard";
import { LiquidButton } from "../../components/LiquidButton";
import { AnimatedGradientText } from "../../components/AnimatedGradientText";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { getFirstName, palette, typeStyles } from "../../lib/design";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { activeWorkspaceId, schemaReady, workspaces } = useWorkspace();

  const firstName = getFirstName(user);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Could not sign out.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedGradientText
          text="Settings"
          style={typeStyles.title}
          colors={["#7366F6", "#F472B6", "#7366F6"]}
        />

        {/* Profile card */}
        <GlassCard style={{ padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                backgroundColor: "rgba(115,102,246,0.14)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Text style={{ color: palette.accent, fontSize: 22, fontWeight: "800" }}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700" }}>{firstName}</Text>
              <Text style={{ color: palette.textMuted, marginTop: 2, fontSize: 14 }}>{user?.email}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Workspaces */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 8 }}>
          <Text style={typeStyles.label}>Workspaces</Text>
          <TouchableOpacity
            onPress={() => router.push("/workspace/create" as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: palette.accent,
              gap: 6,
            }}
          >
            <FontAwesome name="plus" size={11} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>New workspace</Text>
          </TouchableOpacity>
        </View>

        {workspaces.map((workspace) => {
          const active = workspace.id === activeWorkspaceId;
          return (
            <GlassCard key={workspace.id} style={{ padding: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: active ? "rgba(115,102,246,0.14)" : "rgba(21,21,21,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <FontAwesome
                    name={active ? "folder-open" : "folder"}
                    size={16}
                    color={active ? palette.accent : palette.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>{workspace.name}</Text>
                  {active ? (
                    <Text style={{ color: palette.accent, fontSize: 12, fontWeight: "600", marginTop: 1 }}>Active</Text>
                  ) : null}
                </View>
                {schemaReady && !workspace.fallback ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/share/invite" as any,
                        params: { workspaceId: workspace.id },
                      })
                    }
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: palette.line,
                      backgroundColor: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <FontAwesome name="user-plus" size={13} color={palette.accent} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </GlassCard>
          );
        })}

        {workspaces.length === 0 ? (
          <GlassCard style={{ padding: 16, alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: palette.textMuted, fontSize: 14 }}>No workspaces yet. Create one above.</Text>
          </GlassCard>
        ) : null}

        {/* Sign out */}
        <View style={{ marginTop: 16 }}>
          <LiquidButton onPress={handleSignOut} icon="sign-out" label="Sign out" variant="danger" size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
