import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { decode } from "base64-arraybuffer";
import { FontAwesome } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "../../components/GlassCard";
import { LiquidButton } from "../../components/LiquidButton";
import { ListActionModal } from "../../components/ListActionModal";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { friendlyError, palette, typeStyles } from "../../lib/design";
import { supabase } from "../../lib/supabase";

type ItemRow = {
  id: string;
  name: string;
  checked: boolean;
  notes?: string | null;
  image_url?: string | null;
  created_at?: string;
};

type ListInfo = {
  id: string;
  name: string;
  user_id?: string | null;
  workspace_id?: string | null;
};

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const [listInfo, setListInfo] = useState<ListInfo | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetchList();
    fetchItems();

    const channel = supabase
      .channel(`list-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lists", filter: `id=eq.${id}` }, fetchList)
      .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `list_id=eq.${id}` }, fetchItems)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchList = async () => {
    if (!id) return;
    const res = await supabase.from("lists").select("id,name,user_id,workspace_id").eq("id", id).single();
    if (!res.error && res.data) setListInfo(res.data as ListInfo);
  };

  const fetchItems = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const res = await supabase
        .from("items")
        .select("id,name,checked,notes,image_url,created_at")
        .eq("list_id", id)
        .order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setItems((res.data || []) as ItemRow[]);
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const updateListName = async (name: string) => {
    if (!id) return;
    setListInfo((previous) => (previous ? { ...previous, name } : previous));
    const res = await supabase.from("lists").update({ name }).eq("id", id);
    if (res.error) {
      Alert.alert("Error", friendlyError(res.error));
      fetchList();
    }
  };

  const addItem = async () => {
    if (!id || !newItem.trim()) return;

    const trimmedName = newItem.trim();
    setNewItem("");

    try {
      const res = await supabase
        .from("items")
        .insert([
          {
            list_id: id,
            name: trimmedName,
            checked: false,
            user_id: user?.id,
          },
        ])
        .select("id,name,checked,notes,created_at")
        .single();

      if (res.error) throw res.error;
      setItems((previous) => [res.data as ItemRow, ...previous]);
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
      setNewItem(trimmedName);
    }
  };

  const toggleCheck = async (item: ItemRow) => {
    const nextChecked = !item.checked;
    setItems((previous) => previous.map((row) => (row.id === item.id ? { ...row, checked: nextChecked } : row)));

    const res = await supabase.from("items").update({ checked: nextChecked }).eq("id", item.id);
    if (res.error) {
      setItems((previous) => previous.map((row) => (row.id === item.id ? { ...row, checked: item.checked } : row)));
      Alert.alert("Error", friendlyError(res.error));
    }
  };

  const saveItemName = async (itemId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setEditingItemId(null);
      return;
    }

    setItems((previous) => previous.map((item) => (item.id === itemId ? { ...item, name: trimmed } : item)));
    setEditingItemId(null);

    const res = await supabase.from("items").update({ name: trimmed }).eq("id", itemId);
    if (res.error) {
      Alert.alert("Error", friendlyError(res.error));
      fetchItems();
    }
  };

  const saveItemNote = async (itemId: string, note: string) => {
    setItems((previous) => previous.map((item) => (item.id === itemId ? { ...item, notes: note } : item)));
    setEditingNoteId(null);

    const res = await supabase.from("items").update({ notes: note }).eq("id", itemId);
    if (res.error) {
      Alert.alert("Error", friendlyError(res.error));
      fetchItems();
    }
  };

  const removeItem = async (itemId: string) => {
    const previousItems = items;
    setItems((current) => current.filter((item) => item.id !== itemId));

    const res = await supabase.from("items").delete().eq("id", itemId);
    if (res.error) {
      setItems(previousItems);
      Alert.alert("Error", friendlyError(res.error));
    }
  };

  const uploadPhoto = async (itemId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) return;

      setLoading(true);
      const ext = result.assets[0].uri.split('.').pop() || 'jpeg';
      const fileName = `${user?.id || 'guest'}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, decode(result.assets[0].base64), {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, image_url: publicUrlData.publicUrl } : item)));
        await supabase.from("items").update({ image_url: publicUrlData.publicUrl }).eq("id", itemId);
      }
    } catch (error) {
      Alert.alert("Upload Failed", friendlyError(error));
    } finally {
      setLoading(false);
      fetchItems();
    }
  };

  const deleteList = async () => {
    if (!id) return;

    try {
      const res = await supabase.from("lists").delete().eq("id", id);
      if (res.error) throw res.error;
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", friendlyError(error));
    }
  };

  const uncheckedItems = useMemo(() => items.filter((item) => !item.checked), [items]);
  const checkedItems = useMemo(() => items.filter((item) => item.checked), [items]);
  const completion = items.length ? Math.round((checkedItems.length / items.length) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
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
          <FontAwesome name="chevron-left" size={14} color={palette.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <TextInput
            value={listInfo?.name || ""}
            onChangeText={updateListName}
            placeholder="List name"
            placeholderTextColor={palette.textMuted}
            style={{
              color: palette.text,
              fontSize: 20,
              fontWeight: "700",
              paddingVertical: 6,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={() => setActionModalVisible(true)}
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
          <FontAwesome name="ellipsis-v" size={15} color={palette.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 18, marginBottom: 10 }}>
        <GlassCard style={{ padding: 14 }}>
          <Text style={typeStyles.label}>Progress</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: palette.text, fontWeight: "700", fontSize: 16 }}>{completion}%</Text>
            <Text style={{ color: palette.textSoft }}>{checkedItems.length}/{items.length} completed</Text>
          </View>
          <View
            style={{
              marginTop: 10,
              height: 6,
              borderRadius: 999,
              backgroundColor: "rgba(21,21,21,0.13)",
              overflow: "hidden",
            }}
          >
            <View style={{ width: `${completion}%`, height: "100%", backgroundColor: palette.text }} />
          </View>
        </GlassCard>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={palette.text} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingBottom: 170 + Math.max(insets.bottom, 0),
          }}
          showsVerticalScrollIndicator={false}
        >
          {[...uncheckedItems, ...checkedItems].map((item) => {
            const isEditing = editingItemId === item.id;
            const isEditingNote = editingNoteId === item.id;

            return (
              <GlassCard key={item.id} style={{ padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => toggleCheck(item)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      borderWidth: 1,
                      borderColor: item.checked ? palette.text : palette.lineStrong,
                      backgroundColor: item.checked ? palette.text : "rgba(255,255,255,0.5)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    {item.checked ? <FontAwesome name="check" size={12} color="#fff" /> : null}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    {isEditing ? (
                      <TextInput
                        value={editingItemName}
                        onChangeText={setEditingItemName}
                        onSubmitEditing={() => saveItemName(item.id, editingItemName)}
                        onBlur={() => saveItemName(item.id, editingItemName)}
                        autoFocus
                        style={{
                          color: palette.text,
                          fontSize: 15,
                          fontWeight: "600",
                          borderBottomWidth: 1,
                          borderBottomColor: palette.lineStrong,
                          paddingBottom: 3,
                        }}
                      />
                    ) : (
                      <Text
                        style={{
                          color: item.checked ? palette.textMuted : palette.text,
                          textDecorationLine: item.checked ? "line-through" : "none",
                          fontWeight: "600",
                          fontSize: 15,
                        }}
                      >
                        {item.name}
                      </Text>
                    )}
                  </View>

                  {!item.checked ? (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingItemId(item.id);
                        setEditingItemName(item.name);
                      }}
                      style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}
                    >
                      <FontAwesome name="pencil" size={14} color={palette.textMuted} />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}
                  >
                    <FontAwesome name="trash-o" size={15} color={palette.textMuted} />
                  </TouchableOpacity>
                </View>

                {item.image_url ? (
                  <View style={{ marginTop: 12, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: palette.line }}>
                    <Image
                      source={item.image_url}
                      style={{ width: "100%", height: 220 }}
                      contentFit="cover"
                      transition={300}
                    />
                    {!item.checked ? (
                      <TouchableOpacity
                        onPress={() => uploadPhoto(item.id)}
                        style={{ position: "absolute", top: 10, right: 10, backgroundColor: "rgba(21,21,21,0.6)", padding: 8, borderRadius: 8 }}
                      >
                        <FontAwesome name="refresh" size={14} color="#fff" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

                <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    {isEditingNote ? (
                      <View
                        style={{
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: palette.line,
                          backgroundColor: "rgba(255,255,255,0.05)",
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <TextInput
                          value={editingNoteText}
                          onChangeText={setEditingNoteText}
                          autoFocus
                          placeholder="Note"
                          placeholderTextColor={palette.textMuted}
                          multiline
                          style={{ color: palette.text, minHeight: 44 }}
                        />
                        <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "flex-end" }}>
                          <LiquidButton
                            onPress={() => saveItemNote(item.id, editingNoteText.trim())}
                            label="Save"
                            size="sm"
                          />
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingNoteId(item.id);
                          setEditingNoteText(item.notes || "");
                        }}
                        style={{
                          minHeight: 36,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: palette.line,
                          backgroundColor: "rgba(255,255,255,0.03)",
                          paddingHorizontal: 10,
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: item.notes ? palette.textSoft : palette.textMuted, fontSize: 13 }}>
                          {item.notes || "+ Add note"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!item.image_url && !item.checked ? (
                    <TouchableOpacity
                      onPress={() => uploadPhoto(item.id)}
                      style={{
                        minHeight: 36,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: palette.line,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        paddingHorizontal: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                      }}
                    >
                      <FontAwesome name="camera" size={14} color={palette.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </GlassCard>
            );
          })}

          {items.length === 0 ? (
            <GlassCard style={{ padding: 20, alignItems: "center", marginTop: 20 }}>
              <FontAwesome name="clipboard" size={24} color={palette.textMuted} />
              <Text style={{ color: palette.text, fontWeight: "700", marginTop: 8 }}>No items yet</Text>
              <Text style={{ color: palette.textSoft, marginTop: 4 }}>Add your first item below.</Text>
            </GlassCard>
          ) : null}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom + 12, 18),
        }}
      >
        <GlassCard style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={addItem}
              placeholder="Add item"
              placeholderTextColor={palette.textMuted}
              style={{ flex: 1, minHeight: 42, paddingHorizontal: 8, color: palette.text, fontSize: 15 }}
            />
            <LiquidButton onPress={addItem} icon="plus" size="md" disabled={!newItem.trim()} />
          </View>
        </GlassCard>
      </KeyboardAvoidingView>

      <ListActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        title={listInfo?.name || "Actions"}
        anchorTop={64}
        actions={[
          {
            icon: "share-alt",
            label: "Share",
            action: () => {
              const workspaceId =
                activeWorkspaceId && activeWorkspaceId !== "personal"
                  ? activeWorkspaceId
                  : listInfo?.workspace_id || undefined;

              router.push({
                pathname: "/share/invite" as any,
                params: { workspaceId, listId: id },
              });
            },
          },
          ...(listInfo?.user_id === user?.id
            ? [
              {
                icon: "trash-o" as const,
                label: "Delete list",
                action: deleteList,
                destructive: true,
              },
            ]
            : []),
        ]}
      />
    </SafeAreaView>
  );
}
