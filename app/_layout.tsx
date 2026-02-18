import "../global.css";
import React from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { Slot, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Container } from "../components/Container";
import { Sidebar } from "../components/Sidebar";
import { DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";

const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "transparent",
    },
};

function RootLayoutContent() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const { width } = useWindowDimensions();

    // Check if we are in the auth flow
    const isAuthScreen = segments[0] === "(auth)";

    // Sidebar should only show on web, on large screens (not mobile), 
    // when NOT on an auth screen, and when the user is logged in.
    const showSidebar = Platform.OS === "web" && width > 768 && !isAuthScreen && user;

    // Loading state handling (optional, but good for UX)
    if (loading && !user && !isAuthScreen) {
        return <View style={{ flex: 1, backgroundColor: "#F9FAFB" }} />;
    }

    return (
        <View style={{
            flex: 1,
            flexDirection: showSidebar ? "row" : "column",
            backgroundColor: "transparent"
        }}>
            {showSidebar && <Sidebar />}
            <View style={{
                flex: 1,
                backgroundColor: showSidebar ? "rgba(255, 255, 255, 0.1)" : "transparent", // Minimal white, maximum glass
                margin: showSidebar ? 24 : 0,
                borderRadius: showSidebar ? 48 : 0,
                shadowColor: "#000",
                shadowOpacity: showSidebar ? 0.05 : 0,
                shadowRadius: 50,
                overflow: "hidden",
                display: "flex",
                borderWidth: showSidebar ? 1 : 0,
                borderColor: "rgba(255, 255, 255, 0.25)",
                // @ts-ignore
                backdropFilter: showSidebar ? "blur(60px) saturate(180%)" : "none",
                WebkitBackdropFilter: showSidebar ? "blur(60px) saturate(180%)" : "none"
            }}>
                <Container style={!showSidebar ? { maxWidth: 550 } : undefined}>
                    <Slot />
                </Container>
            </View>
        </View>
    );
}

export default function Layout() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <NavThemeProvider value={MyTheme}>
                    <RootLayoutContent />
                </NavThemeProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
