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
                    borderRadius: size * 0.4,
                    backgroundColor: "rgba(255, 126, 115, 0.12)", // More liquid coral
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: "rgba(255, 126, 115, 0.3)",
                    shadowColor: "#FF7E73",
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    // @ts-ignore
                    backdropFilter: "blur(12px)",
                }}
            >
                <FontAwesome name="shopping-bag" size={size * 0.5} color="#FF7E73" />
            </View>
            {showText && (
                <Text
                    style={{
                        marginLeft: 14,
                        fontSize: size * 0.58,
                        fontWeight: "900",
                        color: "#000000",
                        letterSpacing: -1.2,
                    }}
                >
                    Grocery<Text style={{ color: "#FF7E73" }}>.</Text>
                </Text>
            )}
        </View>
    );
};
