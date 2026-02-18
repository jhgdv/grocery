import React from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type ActionItem = {
    icon: keyof typeof FontAwesome.glyphMap;
    label: string;
    action: () => void;
    color?: string;
    destructive?: boolean;
};

type ListActionModalProps = {
    visible: boolean;
    onClose: () => void;
    title: string;
    actions: ActionItem[];
    anchorTop?: number;
    anchorRight?: number;
};

export function ListActionModal({ visible, onClose, title, actions, anchorTop, anchorRight }: ListActionModalProps) {
    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ flex: 1 }}>
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)" }} />
                    <TouchableWithoutFeedback>
                        <View
                            style={{
                                position: "absolute",
                                top: anchorTop ?? 80,
                                right: anchorRight ?? 16,
                                width: 220,
                                backgroundColor: "#ffffff",
                                borderRadius: 16,
                                shadowColor: "#000",
                                shadowOpacity: 0.15,
                                shadowRadius: 20,
                                shadowOffset: { width: 0, height: 8 },
                                elevation: 10,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                overflow: "hidden",
                            }}
                        >
                            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }} numberOfLines={1}>
                                    {title}
                                </Text>
                            </View>
                            {actions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => { onClose(); setTimeout(item.action, 150); }}
                                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}
                                    activeOpacity={0.6}
                                >
                                    <FontAwesome name={item.icon} size={14} color={item.destructive ? "#ef4444" : item.color || "#6b7280"} style={{ width: 20 }} />
                                    <Text style={{ marginLeft: 12, fontSize: 14, fontWeight: "600", color: item.destructive ? "#ef4444" : "#1f2937" }}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
