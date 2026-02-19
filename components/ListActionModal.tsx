import React from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Medical Color Palette
const COLORS = {
    bg: "#f8fafc",
    white: "#ffffff",
    primary: "#0ea5e9",
    primarySoft: "rgba(14, 165, 233, 0.1)",
    text: "#0f172a",
    textSecondary: "#475569",
    textTertiary: "#94a3b8",
    border: "#e2e8f0",
    danger: "#ef4444",
};

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
                    {/* Backdrop */}
                    <View style={{ 
                        position: "absolute", 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        backgroundColor: "rgba(0,0,0,0.4)" 
                    }} />
                    
                    <TouchableWithoutFeedback>
                        <View
                            style={{
                                position: "absolute",
                                top: anchorTop ?? 80,
                                right: anchorRight ?? 16,
                                width: 240,
                                backgroundColor: COLORS.white,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                overflow: "hidden",
                                shadowColor: "#000",
                                shadowOpacity: 0.15,
                                shadowRadius: 20,
                                shadowOffset: { width: 0, height: 8 },
                                elevation: 10,
                            }}
                        >
                            {/* Header */}
                            <View style={{ 
                                paddingHorizontal: 16, 
                                paddingTop: 14, 
                                paddingBottom: 10, 
                                borderBottomWidth: 1, 
                                borderBottomColor: COLORS.border,
                            }}>
                                <Text style={{ 
                                    fontSize: 12, 
                                    fontWeight: "800", 
                                    color: COLORS.textTertiary, 
                                    textTransform: "uppercase", 
                                    letterSpacing: 0.5,
                                }} numberOfLines={1}>
                                    {title}
                                </Text>
                            </View>
                            
                            {/* Actions */}
                            <View style={{ paddingVertical: 6 }}>
                                {actions.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => { onClose(); setTimeout(item.action, 100); }}
                                        style={{ 
                                            flexDirection: "row", 
                                            alignItems: "center", 
                                            paddingHorizontal: 16, 
                                            paddingVertical: 12,
                                            marginHorizontal: 6,
                                            borderRadius: 8,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <FontAwesome 
                                            name={item.icon} 
                                            size={16} 
                                            color={item.destructive ? COLORS.danger : item.color || COLORS.textSecondary} 
                                            style={{ width: 24 }} 
                                        />
                                        <Text style={{ 
                                            marginLeft: 12, 
                                            fontSize: 14, 
                                            fontWeight: "600", 
                                            color: item.destructive ? COLORS.danger : COLORS.text,
                                        }}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
