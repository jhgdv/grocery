import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TouchableWithoutFeedback,
    Dimensions
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    dark: "#1E3A6E",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    bg: "#F4F6FC",
};

type IconCategory = {
    name: string;
    icons: string[];
};

const CATEGORIES: IconCategory[] = [
    {
        name: "Essentials",
        icons: ["list", "check-square-o", "bookmark", "star", "heart", "bell", "tag", "flag", "thumb-tack", "clock-o"],
    },
    {
        name: "Shopping",
        icons: ["shopping-cart", "shopping-basket", "gift", "cutlery", "coffee", "beer", "birthday-cake", "leaf", "apple", "lemon-o"],
    },
    {
        name: "Work & Life",
        icons: ["briefcase", "book", "lightbulb-o", "paint-brush", "camera", "music", "home", "map-marker", "plane", "car"],
    },
    {
        name: "Hobbies",
        icons: ["bicycle", "fire", "paw", "medkit", "snowflake-o", "gamepad", "futbol-o", "film", "headphones", "wrench"],
    },
];

type IconPickerModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (icon: string) => void;
    selectedIcon?: string;
};

export function IconPickerModal({ visible, onClose, onSelect, selectedIcon }: IconPickerModalProps) {
    const [activeCategory, setActiveCategory] = useState("Essentials");

    if (!visible) return null;

    const iconSize = (SCREEN_WIDTH - 64) / 5 - 10;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "flex-end",
                }}>
                    <TouchableWithoutFeedback>
                        <View style={{
                            backgroundColor: COLORS.white,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            height: "72%",
                            overflow: "hidden",
                        }}>
                            {/* Handle + Header */}
                            <View style={{
                                alignItems: "center",
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border,
                                paddingVertical: 16,
                            }}>
                                <View style={{
                                    height: 4,
                                    width: 40,
                                    backgroundColor: COLORS.border,
                                    borderRadius: 2,
                                    marginBottom: 12,
                                }} />
                                <Text style={{
                                    color: COLORS.text,
                                    fontWeight: "800",
                                    fontSize: 18,
                                }}>
                                    Choose Icon
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={{
                                        position: "absolute",
                                        right: 20,
                                        top: 24,
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        backgroundColor: COLORS.bg,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <FontAwesome name="times" size={16} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Category Tabs */}
                            <View style={{
                                height: 52,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border,
                            }}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center", gap: 8 }}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.name}
                                            onPress={() => setActiveCategory(cat.name)}
                                            style={{
                                                paddingHorizontal: 18,
                                                paddingVertical: 8,
                                                borderRadius: 20,
                                                backgroundColor: activeCategory === cat.name ? COLORS.dark : COLORS.bg,
                                                borderWidth: 1,
                                                borderColor: activeCategory === cat.name ? COLORS.dark : COLORS.border,
                                            }}
                                        >
                                            <Text style={{
                                                fontWeight: "700",
                                                fontSize: 13,
                                                color: activeCategory === cat.name ? "#fff" : COLORS.textSecondary,
                                            }}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Icons Grid */}
                            <ScrollView
                                contentContainerStyle={{ padding: 20 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 10,
                                }}>
                                    {CATEGORIES.find(c => c.name === activeCategory)?.icons.map((icon) => {
                                        const isSelected = selectedIcon === icon;
                                        return (
                                            <TouchableOpacity
                                                key={icon}
                                                onPress={() => {
                                                    onSelect(icon);
                                                    onClose();
                                                }}
                                                style={{
                                                    width: iconSize,
                                                    height: iconSize,
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: 14,
                                                    backgroundColor: isSelected ? COLORS.primarySoft : COLORS.bg,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? COLORS.primary : COLORS.border,
                                                }}
                                            >
                                                <FontAwesome
                                                    name={icon as any}
                                                    size={22}
                                                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
