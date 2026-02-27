import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { fonts, palette } from "../lib/design";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface LiquidButtonProps {
  onPress: () => void;
  icon?: keyof typeof FontAwesome.glyphMap;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: any;
}

const SIZES = {
  sm: { height: 36, px: 14, icon: 13, font: 13 },
  md: { height: 44, px: 18, icon: 16, font: 14 },
  lg: { height: 52, px: 24, icon: 18, font: 15 },
};

const VARIANTS: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: {
    bg: palette.accent,
    border: palette.accent,
    text: "#fff",
  },
  secondary: {
    bg: "rgba(255,255,255,0.56)",
    border: palette.line,
    text: palette.text,
  },
  ghost: {
    bg: "rgba(255,255,255,0.24)",
    border: palette.line,
    text: palette.text,
  },
  danger: {
    bg: "rgba(197,48,48,0.12)",
    border: "rgba(197,48,48,0.35)",
    text: palette.danger,
  },
};

export function LiquidButton({
  onPress,
  icon,
  label,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
}: LiquidButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.88}
      style={[{ opacity: disabled ? 0.55 : 1, borderRadius: s.height / 2, overflow: "hidden" }, style]}
    >
      <BlurView intensity={50} tint="light">
        <View
          style={{
            minHeight: s.height,
            paddingHorizontal: s.px,
            borderRadius: s.height / 2,
            backgroundColor: v.bg,
            borderWidth: 1,
            borderColor: v.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon ? <FontAwesome name={icon} size={s.icon} color={v.text} style={{ marginRight: label ? 8 : 0 }} /> : null}
          {label ? (
            <Text style={{ color: v.text, fontSize: s.font, fontWeight: "600", fontFamily: fonts.medium }}>{label}</Text>
          ) : null}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}
