import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";

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
    intensity = 80,
    tint = "light",
    borderRadius = 20
}: GlassCardProps) {
    const cardContent = (
        <View style={[
            styles.container,
            { borderRadius },
            style
        ]}>
            {/* Background blur layer */}
            <BlurView
                intensity={intensity}
                tint={tint}
                style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            
            {/* Gradient overlay for liquid glass effect */}
            <View style={[
                StyleSheet.absoluteFill,
                styles.gradientOverlay,
                { borderRadius }
            ]} />
            
            {/* Border glow effect */}
            <View style={[
                StyleSheet.absoluteFill,
                styles.borderGlow,
                { borderRadius }
            ]} />
            
            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity 
                onPress={onPress}
                activeOpacity={0.9}
                style={styles.touchable}
            >
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
}

const styles = StyleSheet.create({
    touchable: {
        width: '100%',
    },
    container: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
    gradientOverlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    borderGlow: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    content: {
        position: 'relative',
        zIndex: 1,
    }
});
