import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";

import { glass, palette } from "../lib/design";

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  borderRadius?: number;
}

export function GlassCard({
  children,
  onPress,
  style,
  intensity = 58,
  tint = "light",
  borderRadius = 18,
}: GlassCardProps) {
  const content = (
    <View style={[glass.card, { borderRadius }, style]}>
      <BlurView intensity={intensity} tint={tint} style={[StyleSheet.absoluteFill, { borderRadius }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.34)", borderRadius }]} />
      <View style={[StyleSheet.absoluteFill, { borderRadius, borderWidth: 1, borderColor: palette.line }]} />
      <View style={{ zIndex: 2 }}>{children}</View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      {content}
    </TouchableOpacity>
  );
}
