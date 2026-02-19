import React from "react";
import { View, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface LogoProps {
    size?: number;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 44, showText = true }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size * 0.26,
                    backgroundColor: "#1E3A6E",
                    // @ts-ignore
                    background: "linear-gradient(135deg, #1E3A6E 0%, #2D5BA3 100%)",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#1E3A6E",
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                }}
            >
                <FontAwesome name="list" size={size * 0.42} color="white" />
            </View>
            {showText && (
                <Text
                    style={{
                        marginLeft: 10,
                        fontSize: size * 0.56,
                        fontWeight: "800",
                        color: "#1E3A6E",
                        letterSpacing: 1.5,
                    }}
                >
                    LYST
                </Text>
            )}
        </View>
    );
};
