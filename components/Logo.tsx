import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface LogoProps {
    size?: number;
    color?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 44, color = "#8E8AFB", showText = false }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size * 0.35,
                    backgroundColor: "white",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: color,
                    shadowOpacity: 0.25,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 8 },
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.8)",
                    overflow: "hidden"
                }}
            >
                <View style={{
                    position: "absolute",
                    bottom: -size * 0.2,
                    right: -size * 0.2,
                    width: size * 0.8,
                    height: size * 0.8,
                    borderRadius: size * 0.4,
                    backgroundColor: "#FF7E73",
                    opacity: 0.15
                }} />
                <MaterialCommunityIcons name="shopping" size={size * 0.6} color={color} />
            </View>
            {showText && (
                <Text
                    style={{
                        marginLeft: 16,
                        fontSize: size * 0.6,
                        fontWeight: "900",
                        color: "#000000",
                        letterSpacing: -1
                    }}
                >
                    Grocery
                </Text>
            )}
        </View>
    );
};
