import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TouchableWithoutFeedback } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import clsx from "clsx";

type IconCategory = {
    name: string;
    icons: (keyof typeof FontAwesome.glyphMap)[];
};

const CATEGORIES: IconCategory[] = [
    {
        name: "General",
        icons: ["shopping-basket", "shopping-cart", "home", "star", "heart", "gift", "list-ul", "check-square-o"]
    },
    {
        name: "Stores & Brands",
        icons: ["building", "tag", "credit-card", "truck", "dropbox", "cutlery", "coffee", "beer", "glass"]
    },
    {
        name: "Food & Items",
        icons: ["lemon-o", "apple", "leaf", "birthday-cake", "flask", "medkit", "paw", "gamepad"]
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
                <View className="flex-1 bg-black/50 justify-end">
                    <TouchableWithoutFeedback>
                        <View className="bg-white dark:bg-surface-dark rounded-t-3xl h-[70%] overflow-hidden">
                            {/* Header */}
                            <View className="items-center py-4 border-b border-gray-100 dark:border-gray-800">
                                <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-3" />
                                <Text className="text-primary dark:text-white font-bold text-lg">
                                    Choose Icon
                                </Text>
                            </View>

                            {/* Categories */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="max-h-14 border-b border-gray-100 dark:border-gray-800"
                                contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
                            >
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.name}
                                        onPress={() => setActiveCategory(cat.name)}
                                        className={clsx(
                                            "mr-6 py-3 border-b-2",
                                            activeCategory === cat.name
                                                ? "border-accent"
                                                : "border-transparent"
                                        )}
                                    >
                                        <Text className={clsx(
                                            "font-bold text-sm",
                                            activeCategory === cat.name
                                                ? "text-accent"
                                                : "text-gray-400"
                                        )}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Icons Grid */}
                            <ScrollView contentContainerStyle={{ padding: 20 }}>
                                <View className="flex-row flex-wrap justify-between">
                                    {CATEGORIES.find(c => c.name === activeCategory)?.icons.map((icon, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                onSelect(icon);
                                                onClose();
                                            }}
                                            className={clsx(
                                                "w-[22%] aspect-square items-center justify-center rounded-2xl mb-4",
                                                selectedIcon === icon
                                                    ? "bg-primary shadow-lg shadow-primary/30"
                                                    : "bg-gray-50 dark:bg-gray-800"
                                            )}
                                        >
                                            <FontAwesome
                                                name={icon}
                                                size={24}
                                                color={selectedIcon === icon ? "white" : "#94a3b8"}
                                            />
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
