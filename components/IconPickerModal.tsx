import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TouchableWithoutFeedback } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import clsx from "clsx";

type IconCategory = {
    name: string;
    icons: (keyof typeof FontAwesome.glyphMap)[];
};

const CATEGORIES = [
    {
        name: "General",
        icons: ["🛒", "🛍️", "🏪", "🏷️", "💳", "🎁", "🎉", "🎈"]
    },
    {
        name: "Food",
        icons: ["🥦", "🥩", "🍞", "🥛", "🧀", "🥚", "🍕", "🍔", "🥗", "🥘", "🥐", "🍷", "🍺"]
    },
    {
        name: "Home",
        icons: ["🛋️", "🪑", "🛏️", "🚿", "🛠️", "🪴", "📦", "🚚", "💻", "📱", "🎮", "🎧"]
    }
];

type IconPickerModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (icon: string) => void;
    selectedIcon?: string;
};

export function IconPickerModal({ visible, onClose, onSelect, selectedIcon }: IconPickerModalProps) {
    const [activeCategory, setActiveCategory] = useState("General");

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
                    <TouchableWithoutFeedback>
                        <View style={{
                            backgroundColor: "white",
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            height: "70%",
                            overflow: "hidden"
                        }}>
                            {/* Header */}
                            <View style={{ alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 16 }}>
                                <View style={{ height: 6, width: 48, backgroundColor: "#e5e7eb", borderRadius: 3, marginBottom: 12 }} />
                                <Text style={{ color: "#000", fontWeight: "800", fontSize: 18 }}>
                                    Choose Icon
                                </Text>
                            </View>

                            {/* Categories */}
                            <View style={{ height: 56, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.name}
                                            onPress={() => setActiveCategory(cat.name)}
                                            style={{
                                                marginRight: 24,
                                                paddingVertical: 12,
                                                borderBottomWidth: 2,
                                                borderBottomColor: activeCategory === cat.name ? "#FF7E73" : "transparent"
                                            }}
                                        >
                                            <Text style={{
                                                fontWeight: "700",
                                                fontSize: 14,
                                                color: activeCategory === cat.name ? "#FF7E73" : "#9ca3af"
                                            }}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Icons Grid */}
                            <ScrollView contentContainerStyle={{ padding: 20 }}>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }}>
                                    {CATEGORIES.find(c => c.name === activeCategory)?.icons.map((icon, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                onSelect(icon);
                                                onClose();
                                            }}
                                            style={{
                                                width: "20%",
                                                aspectRatio: 1,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: 16,
                                                marginBottom: 12,
                                                backgroundColor: selectedIcon === icon ? "rgba(255, 126, 115, 0.1)" : "transparent",
                                                borderWidth: 1,
                                                borderColor: selectedIcon === icon ? "#FF7E73" : "transparent"
                                            }}
                                        >
                                            <Text style={{ fontSize: 32 }}>{icon}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
