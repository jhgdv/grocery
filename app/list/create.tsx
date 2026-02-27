import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { GlassCard } from "../../components/GlassCard";
import { LiquidButton } from "../../components/LiquidButton";
import { AnimatedGradientText } from "../../components/AnimatedGradientText";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { friendlyError, palette, safeIconName, typeStyles } from "../../lib/design";
import { supabase } from "../../lib/supabase";

const ICONS = [
  "list-ul",
  "shopping-basket",
  "cutlery",
  "check-square-o",
  "home",
  "briefcase",
  "plane",
  "map-marker",
  "heart",
  "coffee",
  "book",
  "car",
  "camera",
  "star",
  "gift",
  "leaf",
  "music",
  "fire",
];

export default function CreateListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeWorkspaceId, activeWorkspace, schemaReady } = useWorkspace();

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("list-ul");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(() => !!name.trim() && !!user, [name, user?.id]);

  const handleCreate = async () => {
    if (!canCreate) return;

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: name.trim(),
        icon: selectedIcon,
        user_id: user?.id,
      };

      // Voeg workspace_id toe als de schema klaar is en er een echte workspace is
      if (schemaReady && activeWorkspaceId && activeWorkspaceId !== "personal") {
        payload.workspace_id = activeWorkspaceId;
      }

      const res = await supabase.from("lists").insert([payload]);

      if (res.error) {
        // Als workspace_id de oorzaak is, probeer opnieuw zonder
        if (res.error.code === "42501" && payload.workspace_id) {
          console.warn("Workspace insert blocked, retrying without workspace_id:", res.error.message);
          delete payload.workspace_id;
          const retry = await supabase.from("lists").insert([payload]);
          if (retry.error) throw retry.error;
        } else {
          throw res.error;
        }
      }

      router.back();
    } catch (err) {
      console.error("Create list error:", err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 28,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.line,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.55)",
            }}
          >
            <FontAwesome name="arrow-left" size={16} color={palette.text} />
          </TouchableOpacity>

          <AnimatedGradientText
            text="New list"
            style={[typeStyles.h2, { marginLeft: 12 }]}
            colors={["#7366F6", "#F472B6", "#7366F6"]}
          />
        </View>

        <GlassCard style={{ padding: 16, marginBottom: 12 }}>
          <Text style={typeStyles.label}>Workspace</Text>
          <Text style={{ color: palette.text, fontSize: 16, fontWeight: "700", marginTop: 8 }}>
            {activeWorkspace?.name || "Personal"}
          </Text>
          <Text style={[typeStyles.body, { marginTop: 4 }]}>
            This list will be shared inside this workspace.
          </Text>
        </GlassCard>

        <GlassCard style={{ padding: 16, marginBottom: 12 }}>
          <Text style={typeStyles.label}>Name</Text>
          <View
            style={{
              marginTop: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: name.trim() ? palette.accent : palette.line,
              backgroundColor: "rgba(255,255,255,0.5)",
            }}
          >
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              placeholder="e.g. Groceries, restaurants, home tasks"
              placeholderTextColor={palette.textMuted}
              style={{ minHeight: 48, paddingHorizontal: 14, color: palette.text, fontSize: 16 }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>
        </GlassCard>

        <GlassCard style={{ padding: 16, marginBottom: 20 }}>
          <Text style={typeStyles.label}>Icon</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {ICONS.map((icon) => {
              const selected = selectedIcon === icon;
              return (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? palette.accent : palette.line,
                    backgroundColor: selected ? "rgba(115,102,246,0.12)" : "rgba(255,255,255,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome
                    name={safeIconName(icon) as keyof typeof FontAwesome.glyphMap}
                    size={20}
                    color={selected ? palette.accent : palette.text}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {error ? (
          <View
            style={{
              marginBottom: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "rgba(229,62,62,0.1)",
              borderWidth: 1,
              borderColor: "rgba(229,62,62,0.25)",
            }}
          >
            <Text style={{ color: palette.danger, fontSize: 14, fontWeight: "600" }}>{error}</Text>
          </View>
        ) : null}

        <LiquidButton
          onPress={handleCreate}
          label={loading ? "Creating..." : "Create list"}
          icon="check"
          size="lg"
          disabled={!canCreate || loading}
        />

        {loading ? (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
