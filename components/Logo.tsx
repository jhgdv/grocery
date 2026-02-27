import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { fonts, palette } from "../lib/design";
import { AnimatedGradientText } from "./AnimatedGradientText";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 42, showText = true }: LogoProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Image
        source={require("../assets/lyst_logo.png")}
        style={{ width: size, height: size, borderRadius: size * 0.26 }}
        contentFit="contain"
      />

      {showText ? (
        <View style={{ marginLeft: 10 }}>
          <AnimatedGradientText
            text="LYST"
            style={{
              fontSize: size * 0.42,
              fontWeight: "700",
              color: palette.text,
              letterSpacing: -0.5,
              fontFamily: fonts.bold,
            }}
            colors={["#F9F4F2", "#a3a3a3", "#F9F4F2"]}
          />
        </View>
      ) : null}
    </View>
  );
}
