import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

import { useAuth } from "../../context/AuthContext";
import { ListActionModal } from "../../components/ListActionModal";
import { supabase } from "../../lib/supabase";

export default function ListDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [listName, setListName] = useState("");
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchListDetails();
            fetchItems();
        }
    }, [id]);

    const fetchListDetails = async () => {
        const { data } = await supabase.from("lists").select("name").eq("id", id).single();
        if (data) setListName(data.name);
    };

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from("items")
                .select("*")
                .eq("list_id", id)
                .order("created_at", { ascending: false }); // Default: newest first
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.log("Error fetching items");
        } finally {
            setLoading(false);
        }
    };

    const reorderItem = async (direction: "up" | "down", item: any) => {
        // Find index in current sorted list
        const index = items.findIndex(i => i.id === item.id);
        if (index === -1) return;

        // Target index
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return; // Out of bounds

        const targetItem = items[targetIndex];

        // Swap timestamps in local state first for immediate UI feedback
        const itemTimestamp = item.created_at;
        const targetTimestamp = targetItem.created_at;

        // Optimistic update
        const newItems = [...items];
        newItems[index] = { ...item, created_at: targetTimestamp };
        newItems[targetIndex] = { ...targetItem, created_at: itemTimestamp };

        // Re-sort to maintain order logic (since we sort by created_at desc)
        newItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setItems(newItems);

        // Update DB
        try {
            await Promise.all([
                supabase.from("items").update({ created_at: targetTimestamp }).eq("id", item.id),
                supabase.from("items").update({ created_at: itemTimestamp }).eq("id", targetItem.id)
            ]);
        } catch (error) {
            console.error("Failed to reorder items", error);
            // Revert state if needed, but let's assume success for smoothness
            fetchItems();
        }
    };

    const updateListName = async (newName: string) => {
        setListName(newName);
        await supabase.from("lists").update({ name: newName }).eq("id", id);
    };

    const toggleCheck = async (itemId: string, currentStatus: boolean) => {
        setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, checked: !currentStatus } : item));
        const { error } = await supabase.from("items").update({ checked: !currentStatus }).eq("id", itemId);
        if (error) {
            setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, checked: currentStatus } : item));
        }
    };

    const addItem = async () => {
        if (!newItem.trim()) return;
        try {
            const { data, error } = await supabase
                .from("items")
                .insert([{ list_id: id, name: newItem.trim(), checked: false, user_id: user?.id }])
                .select()
                .single();
            if (error) throw error;
            // Add new item to top (newest)
            setItems((prev) => [data, ...prev]);
            setNewItem("");
        } catch (error: any) {
            Alert.alert("Error", "Could not add item");
        }
    };

    const deleteItem = async (itemId: string) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        await supabase.from("items").delete().eq("id", itemId);
    };

    const updateItemNotes = async (itemId: string, notes: string) => {
        await supabase.from("items").update({ notes }).eq("id", itemId);
    };

    const pickImage = async (itemId: string) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                uploadImage(itemId, result.assets[0]);
            }
        } catch (e) {
            Alert.alert("Error", "Could not pick image");
        }
    };

    const uploadImage = async (itemId: string, asset: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);
            const base64 = asset.base64;
            const fileName = `${user?.id}/${Date.now()}.jpg`;
            const { data, error } = await supabase.storage.from("item-images").upload(fileName, decode(base64!), { contentType: "image/jpeg" });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from("item-images").getPublicUrl(fileName);
            const { error: dbError } = await supabase.from("items").update({ image_url: publicUrl }).eq("id", itemId);
            if (dbError) throw dbError;
            setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, image_url: publicUrl } : item));
        } catch (error: any) {
            console.log("Upload Error:", error);
            Alert.alert("Upload Failed", "Could not upload image.");
        } finally {
            setUploading(false);
        }
    };

    const toggleExpand = (itemId: string) => {
        const n = new Set(expandedIds);
        n.has(itemId) ? n.delete(itemId) : n.add(itemId);
        setExpandedIds(n);
    };

    // Separate checked vs unchecked for display, but keep them in 'items' array for reordering logic within their groups?
    // Actually, reordering usually only makes sense for unchecked items. Checked items go to bottom.
    const uncheckedItems = items.filter(i => !i.checked);
    const checkedItems = items.filter(i => i.checked);

    const renderItem = ({ item, index, isLast }: { item: any, index: number, isLast: boolean }) => {
        const isExpanded = expandedIds.has(item.id);
        const isChecked = item.checked;

        return (
            <View style={{ marginBottom: 12, marginHorizontal: 16 }}>
                <View
                    style={{
                        backgroundColor: "rgba(255,255,255,0.85)",
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: "rgba(229,231,235,0.6)",
                        flexDirection: "row",
                        alignItems: "center",
                        opacity: isChecked ? 0.6 : 1,
                        padding: 12, // Reduced padding for compactness
                    }}
                >
                    {/* Reorder Arrows (Only for unchecked items) */}
                    {!isChecked && (
                        <View style={{ flexDirection: "column", marginRight: 12, alignItems: "center" }}>
                            {index > 0 && (
                                <TouchableOpacity onPress={() => reorderItem("up", item)} style={{ padding: 4 }}>
                                    <FontAwesome name="chevron-up" size={12} color="#9ca3af" />
                                </TouchableOpacity>
                            )}
                            {index < uncheckedItems.length - 1 && (
                                <TouchableOpacity onPress={() => reorderItem("down", item)} style={{ padding: 4 }}>
                                    <FontAwesome name="chevron-down" size={12} color="#9ca3af" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => toggleCheck(item.id, item.checked)}
                        style={{
                            height: 24,
                            width: 24,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: isChecked ? "#D97D73" : "#d1d5db",
                            backgroundColor: isChecked ? "#D97D73" : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                        hitSlop={8}
                    >
                        {isChecked && <FontAwesome name="check" size={12} color="white" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={{
                            fontSize: 16,
                            fontWeight: "500",
                            color: isChecked ? "#9ca3af" : "#1f2937",
                            textDecorationLine: isChecked ? "line-through" : "none",
                        }}>
                            {item.name}
                        </Text>
                        {(item.notes || item.image_url) && !isChecked && (
                            <View style={{ flexDirection: "row", marginTop: 4 }}>
                                {item.notes ? <FontAwesome name="sticky-note" size={11} color="#9ca3af" style={{ marginRight: 6 }} /> : null}
                                {item.image_url ? <FontAwesome name="image" size={11} color="#9ca3af" /> : null}
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ padding: 4 }}>
                        <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={12} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {isExpanded && (
                    <View style={{ backgroundColor: "rgba(255,255,255,0.7)", marginTop: 4, marginHorizontal: 8, padding: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderTopWidth: 0, borderColor: "rgba(229,231,235,0.6)" }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Details</Text>

                        {uploading && <ActivityIndicator color="#D97D73" style={{ marginBottom: 8 }} />}

                        {item.image_url && (
                            <Image
                                source={{ uri: item.image_url }}
                                style={{ width: "100%", height: 150, borderRadius: 8, marginBottom: 12 }}
                                resizeMode="cover"
                            />
                        )}

                        <TextInput
                            style={{ backgroundColor: "#f9fafb", padding: 12, borderRadius: 8, color: "#1f2937", fontSize: 14, marginBottom: 12, height: 80, textAlignVertical: "top" }}
                            multiline
                            placeholder="Add notes..."
                            placeholderTextColor="#9ca3af"
                            defaultValue={item.notes}
                            onEndEditing={(e) => updateItemNotes(item.id, e.nativeEvent.text)}
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <TouchableOpacity onPress={() => pickImage(item.id)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                                <FontAwesome name="camera" size={14} color="#1f2937" />
                                <Text style={{ marginLeft: 8, color: "#1f2937", fontSize: 12, fontWeight: "700" }}>
                                    {item.image_url ? "Change Photo" : "Add Photo"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteItem(item.id)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                                <FontAwesome name="trash-o" size={14} color="#ef4444" />
                                <Text style={{ marginLeft: 8, color: "#ef4444", fontSize: 12, fontWeight: "700" }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(229,231,235,0.4)" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }} hitSlop={8}>
                    <FontAwesome name="arrow-left" size={18} color="#1f2937" />
                </TouchableOpacity>
                <TextInput
                    style={{ flex: 1, fontSize: 20, fontWeight: "700", textAlign: "center", color: "#1f2937", marginHorizontal: 12 }}
                    value={listName}
                    onChangeText={updateListName}
                />
                <TouchableOpacity onPress={() => setActionModalVisible(true)} style={{ height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }} hitSlop={8}>
                    <FontAwesome name="ellipsis-v" size={18} color="#1f2937" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color="#D97D73" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={[...uncheckedItems, ...checkedItems]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => renderItem({ item, index, isLast: false })}
                    contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Add Item Bar */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0} style={{ position: "absolute", bottom: 24, left: 16, right: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", padding: 8, paddingLeft: 20, borderRadius: 999, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4, borderWidth: 1, borderColor: "rgba(229,231,235,0.8)" }}>
                    <TextInput
                        style={{ flex: 1, color: "#1f2937", fontWeight: "500", height: 48 }}
                        placeholder="Add new item..."
                        placeholderTextColor="#9ca3af"
                        value={newItem}
                        onChangeText={setNewItem}
                        onSubmitEditing={addItem}
                    />
                    <TouchableOpacity onPress={addItem} style={{ backgroundColor: "#D97D73", height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 8 }} activeOpacity={0.8}>
                        <FontAwesome name="plus" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <ListActionModal
                visible={actionModalVisible}
                onClose={() => setActionModalVisible(false)}
                title={listName}
                anchorTop={60}
                anchorRight={16}
                actions={[
                    { icon: "share-alt", label: "Share", action: () => router.push({ pathname: "/share/invite" as any, params: { listId: id } }), color: "#1f2937" },
                    { icon: "trash-o", label: "Delete List", action: () => router.back(), destructive: true },
                ]}
            />
        </SafeAreaView>
    );
}
