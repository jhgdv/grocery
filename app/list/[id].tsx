import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Keyboard } from "react-native";
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
    const [selectedList, setSelectedList] = useState<any>(null);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemName, setEditingItemName] = useState("");
    const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

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
        try {
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
            const { error } = await supabase.from("items").update({ notes }).eq("id", itemId);
            if (error) throw error;
            Alert.alert("Success", "Notes saved!");
        } catch (error: any) {
            console.error("Error updating notes:", error);
            Alert.alert("Error", "Could not save notes. " + (error.message || ""));
            fetchItems(); // Revert local state
        }
    };

    const updateItemName = async (itemId: string, newName: string) => {
        if (!newName.trim()) {
            setEditingItemId(null);
            return;
        }
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, name: newName.trim() } : i));
        const { error } = await supabase.from("items").update({ name: newName.trim() }).eq("id", itemId);
        if (error) {
            Alert.alert("Error", "Could not update item name");
            fetchItems();
        }
        setEditingItemId(null);
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
            const fileName = `${user?.id}/${Date.now()}.jpg`;

            // For cross-platform compatibility, fetch the URI and convert to blob
            const response = await fetch(asset.uri);
            const blob = await response.blob();

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("item-images")
                .upload(fileName, blob, {
                    contentType: "image/jpeg",
                    upsert: true
                });

            if (uploadError) {
                console.error("Storage Upload Error:", uploadError);
                throw uploadError;
            }

            // Important: Get the public URL AFTER successful upload
            const { data: urlData } = supabase.storage
                .from("item-images")
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;
            console.log("Generated Public URL:", publicUrl);

            // Update the database with the new image URL
            const { error: dbError } = await supabase
                .from("items")
                .update({ image_url: publicUrl })
                .eq("id", itemId);

            if (dbError) {
                console.error("Database Update Error:", dbError);
                throw dbError;
            }

            // Update local state immediately
            setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, image_url: publicUrl } : item));
            Alert.alert("Success", "Photo saved successfully!");
        } catch (error: any) {
            console.error("Full Upload Error Details:", error);
            Alert.alert("Upload Failed", error.message || "Could not save image. Make sure the storage bucket exists.");
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
            <View style={{ marginBottom: 16, marginHorizontal: 20 }}>
                <View
                    style={{
                        backgroundColor: "rgba(255,255,255,0.7)",
                        borderRadius: 28,
                        borderWidth: 1,
                        borderColor: isChecked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
                        flexDirection: "row",
                        alignItems: "center",
                        opacity: isChecked ? 0.6 : 1,
                        padding: 16,
                        shadowColor: "#8E8AFB",
                        shadowOpacity: isChecked ? 0 : 0.08,
                        shadowRadius: 15,
                        shadowOffset: { width: 0, height: 10 },
                        elevation: isChecked ? 0 : 3,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => toggleCheck(item.id, item.checked)}
                        style={{
                            height: 32,
                            width: 32,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isChecked ? "#8E8AFB" : "#E5E5EA",
                            backgroundColor: isChecked ? "#8E8AFB" : "rgba(255,255,255,0.5)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                            shadowColor: isChecked ? "#8E8AFB" : "transparent",
                            shadowOpacity: 0.3,
                            shadowRadius: 5,
                            shadowOffset: { width: 0, height: 2 }
                        }}
                        hitSlop={12}
                    >
                        {isChecked && <FontAwesome name="check" size={14} color="white" />}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        {editingItemId === item.id ? (
                            <TextInput
                                style={{
                                    fontSize: 17,
                                    fontWeight: "700",
                                    color: "#000000",
                                    paddingVertical: 4,
                                    borderBottomWidth: 2,
                                    borderBottomColor: "#8E8AFB",
                                }}
                                value={editingItemName}
                                onChangeText={setEditingItemName}
                                onBlur={() => updateItemName(item.id, editingItemName)}
                                onSubmitEditing={() => updateItemName(item.id, editingItemName)}
                                autoFocus
                            />
                        ) : (
                            <TouchableOpacity
                                onPress={() => toggleExpand(item.id)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={{
                                        fontSize: 17,
                                        fontWeight: "700",
                                        color: isChecked ? "#8E9196" : "#000000",
                                        textDecorationLine: isChecked ? "line-through" : "none",
                                    }}>
                                    {item.name}
                                </Text>
                                {item.notes && !isChecked && (
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: 13,
                                            color: "#71717A",
                                            marginTop: 2,
                                            fontWeight: "500"
                                        }}
                                    >
                                        {item.notes}
                                    </Text>
                                )}
                                {item.image_url && !isChecked && !item.notes && (
                                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                                        <FontAwesome name="image" size={12} color="#8E8AFB" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {!isChecked && editingItemId !== item.id && (
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingItemId(item.id);
                                    setEditingItemName(item.name);
                                }}
                                style={{ padding: 10 }}
                            >
                                <FontAwesome name="pencil" size={14} color="#D1D1D6" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ padding: 10 }}>
                            <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#D1D1D6" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isExpanded && (
                    <View style={{
                        backgroundColor: "rgba(255,255,255,0.6)",
                        marginTop: -10,
                        marginHorizontal: 12,
                        padding: 20,
                        paddingTop: 28,
                        borderBottomLeftRadius: 28,
                        borderBottomRightRadius: 28,
                        borderWidth: 1,
                        borderTopWidth: 0,
                        borderColor: "rgba(255,255,255,0.4)",
                        zIndex: -1,
                        shadowColor: "#000",
                        shadowOpacity: 0.03,
                        shadowRadius: 10,
                    }}>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: "#A1A1AA", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Details</Text>

                        {uploading && <ActivityIndicator color="#8E8AFB" style={{ marginBottom: 16 }} />}

                        {item.image_url && (
                            <Image
                                source={{ uri: item.image_url }}
                                style={{ width: "100%", height: 300, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" }}
                                resizeMode="contain"
                            />
                        )}

                        <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 16 }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: "rgba(255,255,255,0.5)",
                                    padding: 16,
                                    borderRadius: 20,
                                    color: "#000000",
                                    fontSize: 16,
                                    fontWeight: "500",
                                    height: 100,
                                    textAlignVertical: "top",
                                    borderWidth: 1,
                                    borderColor: "rgba(255,255,255,0.3)"
                                }}
                                multiline
                                placeholder="Add notes..."
                                placeholderTextColor="#A1A1AA"
                                value={editingNotes[item.id] !== undefined ? editingNotes[item.id] : (item.notes || "")}
                                onChangeText={(text) => setEditingNotes(prev => ({ ...prev, [item.id]: text }))}
                                onEndEditing={(e) => updateItemNotes(item.id, e.nativeEvent.text)}
                                blurOnSubmit={true}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    const currentNote = editingNotes[item.id] !== undefined ? editingNotes[item.id] : (item.notes || "");
                                    updateItemNotes(item.id, currentNote);
                                    Keyboard.dismiss();
                                }}
                                style={{
                                    backgroundColor: "#8E8AFB",
                                    width: 44,
                                    height: 44,
                                    borderRadius: 15,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginLeft: 12,
                                    marginBottom: 4
                                }}
                            >
                                <FontAwesome name="check" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <TouchableOpacity
                                onPress={() => pickImage(item.id)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#f2f1ff",
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 16
                                }}
                            >
                                <FontAwesome name="camera" size={16} color="#8E8AFB" />
                                <Text style={{ marginLeft: 8, color: "#8E8AFB", fontSize: 14, fontWeight: "800" }}>
                                    {item.image_url ? "Change" : "Add Photo"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => deleteItem(item.id)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#fff1f1",
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 16
                                }}
                            >
                                <FontAwesome name="trash-o" size={16} color="#FF7E73" />
                                <Text style={{ marginLeft: 8, color: "#FF7E73", fontSize: 14, fontWeight: "800" }}>Delete</Text>
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
            <View style={{
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)");
                        }
                    }}
                    style={{
                        height: 48,
                        width: 48,
                        borderRadius: 24,
                        backgroundColor: "white",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2
                    }}
                    hitSlop={12}
                >
                    <FontAwesome name="chevron-left" size={16} color="#000000" />
                </TouchableOpacity>

                <View style={{ flex: 1, marginHorizontal: 16 }}>
                    <TextInput
                        style={{
                            fontSize: 22,
                            fontWeight: "800",
                            color: "#000000",
                            textAlign: "center"
                        }}
                        value={listName}
                        onChangeText={updateListName}
                        placeholder="List Name"
                    />
                </View>

                <TouchableOpacity
                    onPress={() => setActionModalVisible(true)}
                    style={{
                        height: 48,
                        width: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2,
                        // @ts-ignore
                        backdropFilter: "blur(10px)"
                    }}
                    hitSlop={12}
                >
                    <FontAwesome name="ellipsis-v" size={18} color="#000000" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color="#FF7E73" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={[...uncheckedItems, ...checkedItems]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => renderItem({ item, index, isLast: false })}
                    contentContainerStyle={{ paddingBottom: 150, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Add Item Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                style={{ position: "absolute", bottom: 40, left: 24, right: 24 }}
            >
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    padding: 8,
                    paddingLeft: 24,
                    borderRadius: 28,
                    shadowColor: "#FF7E73",
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    // @ts-ignore
                    backdropFilter: "blur(20px)"
                }}>
                    <TextInput
                        style={{ flex: 1, color: "#000000", fontWeight: "600", fontSize: 16, height: 52 }}
                        placeholder="What else do you need?"
                        placeholderTextColor="#71717A"
                        value={newItem}
                        onChangeText={setNewItem}
                        onSubmitEditing={addItem}
                    />
                    <TouchableOpacity
                        onPress={addItem}
                        style={{
                            backgroundColor: "#FF7E73",
                            height: 44,
                            width: 44,
                            borderRadius: 22,
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 12,
                            shadowColor: "#FF7E73",
                            shadowOpacity: 0.3,
                            shadowRadius: 10
                        }}
                        activeOpacity={0.8}
                    >
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
                    { icon: "user-plus", label: "Invite Collaborators", action: () => router.push({ pathname: "/share/invite" as any, params: { listId: id } }), color: "#FF7E73" },
                    { icon: "trash-o", label: "Delete List", action: () => router.back(), destructive: true },
                ]}
            />
        </SafeAreaView>
    );
}
