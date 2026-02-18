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
                    borderRadius: size * 0.35,
                    backgroundColor: "#FF7E73", // Coral background
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#FF7E73",
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                }}
            >
                <FontAwesome name="shopping-bag" size={size * 0.55} color="#A7F3D0" />
            </View>
            {showText && (
                <Text
                    style={{
                        marginLeft: 12,
                        fontSize: size * 0.6,
                        fontWeight: "900",
                        color: "#000000",
                        letterSpacing: -1,
                    }}
                >
                    Grocery<Text style={{ color: "#FF7E73" }}>.</Text>
                </Text>
            )}
        </View>
    );
};
