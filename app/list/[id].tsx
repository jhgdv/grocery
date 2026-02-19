import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    ScrollView,
    Modal,
    Dimensions,
    StatusBar,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../context/AuthContext";
import { ListActionModal } from "../../components/ListActionModal";
import { supabase } from "../../lib/supabase";

const COLORS = {
    bg: "#F4F6FC",
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primaryLight: "#91BBE6",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    accent: "#B39DDB",
    accentSoft: "rgba(179, 157, 219, 0.12)",
    success: "#5BC8A4",
    successSoft: "rgba(91, 200, 164, 0.1)",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    borderLight: "#EEF3FA",
    danger: "#E58A8A",
    dangerSoft: "rgba(229, 138, 138, 0.1)",
};

function AppCard({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View style={[
            {
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
            },
            style
        ]}>
            {children}
        </View>
    );
}

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
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemName, setEditingItemName] = useState("");
    const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        fetchListDetails();
        fetchItems();

        const channel = supabase
            .channel(`list-sync-${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${id}` }, () => {
                fetchItems();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `id=eq.${id}` }, () => {
                fetchListDetails();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
                .order("created_at", { ascending: false });
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.log("Error fetching items");
        } finally {
            setLoading(false);
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
        } catch (error: any) {
            console.error("Error updating notes:", error);
            Alert.alert("Error", "Could not save notes");
            fetchItems();
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

            const response = await fetch(asset.uri);
            const blob = await response.blob();

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("item-images")
                .upload(fileName, blob, {
                    contentType: "image/jpeg",
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("item-images")
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            const { error: dbError } = await supabase
                .from("items")
                .update({ image_url: publicUrl })
                .eq("id", itemId);

            if (dbError) throw dbError;

            setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, image_url: publicUrl } : item));
            Alert.alert("Success", "Photo saved successfully!");
        } catch (error: any) {
            console.error("Upload error:", error);
            Alert.alert("Upload Failed", error.message || "Could not save image");
        } finally {
            setUploading(false);
        }
    };

    const toggleExpand = (itemId: string) => {
        const n = new Set(expandedIds);
        n.has(itemId) ? n.delete(itemId) : n.add(itemId);
        setExpandedIds(n);
    };

    const uncheckedItems = items.filter(i => !i.checked);
    const checkedItems = items.filter(i => i.checked);
    const progress = items.length > 0 ? Math.round((checkedItems.length / items.length) * 100) : 0;

    const renderItem = ({ item }: { item: any }) => {
        const isExpanded = expandedIds.has(item.id);
        const isChecked = item.checked;

        return (
            <View style={{ marginBottom: 12 }}>
                <AppCard>
                    <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            {/* Checkbox */}
                            <TouchableOpacity
                                onPress={() => toggleCheck(item.id, item.checked)}
                                style={{
                                    height: 24,
                                    width: 24,
                                    borderRadius: 6,
                                    borderWidth: 2,
                                    borderColor: isChecked ? COLORS.success : COLORS.border,
                                    backgroundColor: isChecked ? COLORS.success : COLORS.white,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                }}
                                hitSlop={12}
                            >
                                {isChecked && <FontAwesome name="check" size={14} color="white" />}
                            </TouchableOpacity>

                            {/* Content */}
                            <View style={{ flex: 1 }}>
                                {editingItemId === item.id ? (
                                    <TextInput
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "600",
                                            color: COLORS.text,
                                            paddingVertical: 4,
                                            borderBottomWidth: 2,
                                            borderBottomColor: COLORS.primary,
                                        }}
                                        value={editingItemName}
                                        onChangeText={setEditingItemName}
                                        onBlur={() => updateItemName(item.id, editingItemName)}
                                        onSubmitEditing={() => updateItemName(item.id, editingItemName)}
                                        autoFocus
                                    />
                                ) : (
                                    <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontWeight: "600",
                                                color: isChecked ? COLORS.textTertiary : COLORS.text,
                                                textDecorationLine: isChecked ? "line-through" : "none",
                                            }}
                                        >
                                            {item.name}
                                        </Text>
                                        {item.notes ? (
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    fontSize: 12,
                                                    color: COLORS.textTertiary,
                                                    marginTop: 3,
                                                    fontWeight: "400",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {item.notes}
                                            </Text>
                                        ) : null}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Actions */}
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                {!isChecked && editingItemId !== item.id && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setEditingItemId(item.id);
                                            setEditingItemName(item.name);
                                        }}
                                        style={{ padding: 8, marginRight: 4 }}
                                    >
                                        <FontAwesome name="pencil" size={14} color={COLORS.textTertiary} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    onPress={() => toggleExpand(item.id)} 
                                    style={{ padding: 8 }}
                                >
                                    <FontAwesome 
                                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                                        size={14} 
                                        color={COLORS.textTertiary} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                                {uploading && (
                                    <ActivityIndicator color={COLORS.primary} style={{ marginBottom: 16 }} />
                                )}

                                {item.image_url && (
                                    <TouchableOpacity
                                        onPress={() => setViewerUrl(item.image_url)}
                                        activeOpacity={0.92}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <View style={{
                                            width: "100%",
                                            backgroundColor: COLORS.borderLight,
                                            borderRadius: 12,
                                            overflow: "hidden",
                                        }}>
                                            <Image
                                                source={{ uri: item.image_url }}
                                                style={{ width: "100%", aspectRatio: 4 / 3 }}
                                                resizeMode="contain"
                                            />
                                        </View>
                                        <View style={{
                                            position: "absolute",
                                            bottom: 8,
                                            right: 8,
                                            backgroundColor: "rgba(0,0,0,0.45)",
                                            borderRadius: 8,
                                            padding: 6,
                                        }}>
                                            <FontAwesome name="expand" size={13} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {/* Notes */}
                                <View style={{ marginBottom: 16 }}>
                                    {activeNoteId === item.id ? (
                                        <View style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            backgroundColor: COLORS.borderLight,
                                            borderRadius: 10,
                                            borderWidth: 1.5,
                                            borderColor: COLORS.primary,
                                            paddingLeft: 12,
                                            paddingRight: 6,
                                            paddingVertical: 6,
                                        }}>
                                            <TextInput
                                                style={{
                                                    flex: 1,
                                                    color: COLORS.text,
                                                    fontSize: 14,
                                                    fontWeight: "500",
                                                    paddingVertical: 6,
                                                }}
                                                placeholder="Type a note..."
                                                placeholderTextColor={COLORS.textTertiary}
                                                value={editingNotes[item.id] !== undefined ? editingNotes[item.id] : (item.notes || "")}
                                                onChangeText={(text) => setEditingNotes(prev => ({ ...prev, [item.id]: text }))}
                                                onSubmitEditing={(e) => {
                                                    updateItemNotes(item.id, e.nativeEvent.text);
                                                    setActiveNoteId(null);
                                                }}
                                                returnKeyType="done"
                                                autoFocus
                                            />
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const text = editingNotes[item.id] !== undefined ? editingNotes[item.id] : (item.notes || "");
                                                    updateItemNotes(item.id, text);
                                                    setActiveNoteId(null);
                                                }}
                                                style={{
                                                    backgroundColor: COLORS.primary,
                                                    borderRadius: 8,
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 8,
                                                    marginLeft: 6,
                                                }}
                                            >
                                                <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Save</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : item.notes ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setActiveNoteId(item.id);
                                                setEditingNotes(prev => ({ ...prev, [item.id]: item.notes || "" }));
                                            }}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: COLORS.borderLight,
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: COLORS.border,
                                                padding: 12,
                                                gap: 10,
                                            }}
                                        >
                                            <FontAwesome name="sticky-note-o" size={14} color={COLORS.textTertiary} />
                                            <Text style={{ flex: 1, color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" }}>
                                                {item.notes}
                                            </Text>
                                            <FontAwesome name="pencil" size={13} color={COLORS.textTertiary} />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setActiveNoteId(item.id);
                                                setEditingNotes(prev => ({ ...prev, [item.id]: "" }));
                                            }}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: COLORS.borderLight,
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: COLORS.border,
                                                padding: 12,
                                                gap: 10,
                                            }}
                                        >
                                            <FontAwesome name="plus" size={13} color={COLORS.textTertiary} />
                                            <Text style={{ color: COLORS.textTertiary, fontSize: 13, fontWeight: "600" }}>Add note</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => pickImage(item.id)}
                                        style={{
                                            flex: 1,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: COLORS.primarySoft,
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                            gap: 8,
                                        }}
                                    >
                                        <FontAwesome name="camera" size={16} color={COLORS.primary} />
                                        <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "700" }}>
                                            {item.image_url ? "Change Photo" : "Add Photo"}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteItem(item.id)}
                                        style={{
                                            flex: 1,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: COLORS.dangerSoft,
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                            gap: 8,
                                        }}
                                    >
                                        <FontAwesome name="trash-o" size={16} color={COLORS.danger} />
                                        <Text style={{ color: COLORS.danger, fontSize: 14, fontWeight: "700" }}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </AppCard>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={{
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
                    style={{
                        height: 44,
                        width: 44,
                        borderRadius: 12,
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    hitSlop={12}
                >
                    <FontAwesome name="chevron-left" size={16} color={COLORS.text} />
                </TouchableOpacity>

                <View style={{ flex: 1, marginHorizontal: 16 }}>
                    <TextInput
                        style={{
                            fontSize: 18,
                            fontWeight: "800",
                            color: COLORS.text,
                            textAlign: "center",
                        }}
                        value={listName}
                        onChangeText={updateListName}
                        placeholder="List Title"
                        placeholderTextColor={COLORS.textTertiary}
                    />
                </View>

                <TouchableOpacity
                    onPress={() => setActionModalVisible(true)}
                    style={{
                        height: 44,
                        width: 44,
                        borderRadius: 13,
                        backgroundColor: COLORS.primary,
                        // @ts-ignore
                        background: 'linear-gradient(135deg, #6BA0D8 0%, #B39DDB 100%)',
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#8A9FD8",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                    hitSlop={12}
                >
                    <FontAwesome name="ellipsis-v" size={18} color="white" />
                </TouchableOpacity>
            </View>

            {/* Progress Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <AppCard style={{ padding: 16 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" }}>
                            Progress
                        </Text>
                        <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: "700" }}>
                            {progress}%
                        </Text>
                    </View>
                    <View style={{
                        height: 8,
                        backgroundColor: COLORS.borderLight,
                        borderRadius: 4,
                        overflow: "hidden",
                    }}>
                        <View style={{
                            height: "100%",
                            width: `${progress}%`,
                            backgroundColor: COLORS.primary,
                            borderRadius: 4,
                        }} />
                    </View>
                    <View style={{ flexDirection: "row", marginTop: 12, gap: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: COLORS.primary,
                                marginRight: 6,
                            }} />
                            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                                {uncheckedItems.length} Pending
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: COLORS.success,
                                marginRight: 6,
                            }} />
                            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                                {checkedItems.length} Completed
                            </Text>
                        </View>
                    </View>
                </AppCard>
            </View>

            {/* Items List */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                >
                    {[...uncheckedItems, ...checkedItems].map((item) => renderItem({ item }))}

                    {items.length === 0 && (
                        <View style={{ alignItems: "center", justifyContent: "center", marginTop: 60 }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 24,
                                backgroundColor: COLORS.borderLight,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                            }}>
                                <FontAwesome name="clipboard" size={32} color={COLORS.textTertiary} />
                            </View>
                            <Text style={{ 
                                color: COLORS.textSecondary, 
                                fontSize: 16, 
                                fontWeight: "600",
                                marginBottom: 4,
                            }}>
                                No items yet
                            </Text>
                            <Text style={{ 
                                color: COLORS.textTertiary, 
                                fontSize: 14,
                            }}>
                                Add your first item to get started
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Add Item Bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                style={{ position: "absolute", bottom: 30, left: 20, right: 20 }}
            >
                <AppCard>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 6,
                        paddingLeft: 18,
                    }}>
                        <TextInput
                            style={{ 
                                flex: 1, 
                                color: COLORS.text, 
                                fontWeight: "600", 
                                fontSize: 15, 
                                height: 48,
                            }}
                            placeholder="Add item..."
                            placeholderTextColor={COLORS.textTertiary}
                            value={newItem}
                            onChangeText={setNewItem}
                            onSubmitEditing={addItem}
                        />
                        <TouchableOpacity
                            onPress={addItem}
                            style={{
                                backgroundColor: COLORS.primary,
                                // @ts-ignore
                                background: 'linear-gradient(135deg, #6BA0D8 0%, #B39DDB 100%)',
                                height: 44,
                                width: 44,
                                borderRadius: 12,
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: 12,
                                shadowColor: "#8A9FD8",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                            activeOpacity={0.8}
                        >
                            <FontAwesome name="plus" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </AppCard>
            </KeyboardAvoidingView>

            {/* Fullscreen Image Viewer */}
            <Modal
                visible={!!viewerUrl}
                transparent
                animationType="fade"
                onRequestClose={() => setViewerUrl(null)}
                statusBarTranslucent
            >
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.97)",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <TouchableOpacity
                        onPress={() => setViewerUrl(null)}
                        style={{
                            position: "absolute",
                            top: 52,
                            right: 20,
                            zIndex: 10,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "rgba(255,255,255,0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        hitSlop={12}
                    >
                        <FontAwesome name="times" size={18} color="white" />
                    </TouchableOpacity>

                    <ScrollView
                        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                        contentContainerStyle={{
                            width: SCREEN_WIDTH,
                            height: SCREEN_HEIGHT,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        maximumZoomScale={4}
                        minimumZoomScale={1}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        centerContent
                    >
                        {viewerUrl && (
                            <Image
                                source={{ uri: viewerUrl }}
                                style={{
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_HEIGHT * 0.82,
                                }}
                                resizeMode="contain"
                            />
                        )}
                    </ScrollView>

                    <View style={{
                        position: "absolute",
                        bottom: 40,
                        alignItems: "center",
                    }}>
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "500" }}>
                            Pinch to zoom
                        </Text>
                    </View>
                </View>
            </Modal>

            <ListActionModal
                visible={actionModalVisible}
                onClose={() => setActionModalVisible(false)}
                title={listName}
                anchorTop={60}
                anchorRight={16}
                actions={[
                    { 
                        icon: "user-plus", 
                        label: "Invite Collaborators", 
                        action: () => router.push({ pathname: "/share/invite" as any, params: { listId: id } }), 
                        color: COLORS.primary,
                    },
                    { 
                        icon: "trash-o", 
                        label: "Delete", 
                        action: () => router.back(), 
                        destructive: true,
                    },
                ]}
            />
        </SafeAreaView>
    );
}
