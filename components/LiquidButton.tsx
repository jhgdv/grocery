import React from "react";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesome } from "@expo/vector-icons";

interface LiquidButtonProps {
    onPress: () => void;
    icon?: string;
    label?: string;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    style?: any;
}

export function LiquidButton({
    onPress,
    icon,
    label,
    variant = "primary",
    size = "md",
    style
}: LiquidButtonProps) {
    const sizes = {
        sm: { height: 36, paddingHorizontal: 16, iconSize: 14, fontSize: 13 },
        md: { height: 44, paddingHorizontal: 20, iconSize: 16, fontSize: 14 },
        lg: { height: 52, paddingHorizontal: 28, iconSize: 18, fontSize: 15 },
    };

    const variants = {
        primary: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            textColor: "#ffffff",
        },
        secondary: {
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            borderColor: "rgba(255, 255, 255, 0.8)",
            textColor: "#000000",
        },
        ghost: {
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.3)",
            textColor: "#000000",
        },
        danger: {
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.3)",
            textColor: "#ef4444",
        },
    };

    const s = sizes[size];
    const v = variants[variant];

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[styles.button, { height: s.height }, style]}
        >
            <BlurView
                intensity={variant === "primary" ? 20 : 60}
                tint={variant === "primary" ? "dark" : "light"}
                style={[StyleSheet.absoluteFill, styles.blur]}
            />
            <View
                style={[
                    styles.content,
                    {
                        backgroundColor: v.backgroundColor,
                        borderColor: v.borderColor,
                        paddingHorizontal: s.paddingHorizontal,
                    },
                ]}
            >
                {icon && (
                    <FontAwesome
                        name={icon as any}
                        size={s.iconSize}
                        color={v.textColor}
                        style={label ? styles.iconWithLabel : undefined}
                    />
                )}
                {label && (
                    <Text
                        style={[
                            styles.label,
                            {
                                color: v.textColor,
                                fontSize: s.fontSize,
                            },
                        ]}
                    >
                        {label}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        overflow: "hidden",
    },
    blur: {
        borderRadius: 12,
    },
    content: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        borderWidth: 1,
    },
    iconWithLabel: {
        marginRight: 8,
    },
    label: {
        fontWeight: "600",
        fontFamily: "Plus Jakarta Sans",
    },
});
