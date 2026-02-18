import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface LogoProps {
    size?: number;
    color?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 44, color = "#D97D73", showText = false }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size * 0.25,
                    backgroundColor: color, // Solid accent pink background
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <MaterialCommunityIcons name="basket-outline" size={size * 0.6} color="#dcfce7" />
            </View>
            {showText && (
                <Text
                    style={{
                        marginLeft: 12,
                        fontSize: size * 0.5,
                        fontWeight: "900",
                        color: "#1f2937",
                        letterSpacing: -0.5
                    }}
                >
                    Grocery
                </Text>
            )}
        </View>
    );
};
