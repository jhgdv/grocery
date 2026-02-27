import React, { useEffect } from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from "react-native-reanimated";

interface AnimatedGradientTextProps {
    text: string;
    style?: TextStyle | TextStyle[];
    colors?: string[];
}

export function AnimatedGradientText({
    text,
    style,
    colors = ["#7366F6", "#F472B6", "#7366F6", "#F472B6", "#7366F6"],
}: AnimatedGradientTextProps) {
    const shimmerValue = useSharedValue(-1);

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 3500, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: shimmerValue.value * 300 }],
        };
    });

    return (
        <MaskedView
            style={{ flexDirection: "row", height: (Array.isArray(style) ? style[0]?.fontSize : style?.fontSize) || 30 }}
            maskElement={<Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>}
        >
            <Text style={[style, { opacity: 0 }]}>{text}</Text>
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { width: "300%", left: "-100%" }]}>
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </MaskedView>
    );
}
