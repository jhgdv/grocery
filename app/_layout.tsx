import "../global.css";
import React from "react";
import { Platform, View } from "react-native";
import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
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

export default function Layout() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <NavThemeProvider value={MyTheme}>
                    <View style={{
                        flex: 1,
                        flexDirection: Platform.OS === "web" ? "row" : "column",
                        backgroundColor: Platform.OS === "web" ? "#F9FAFB" : "transparent"
                    }}>
                        {Platform.OS === "web" && <Sidebar />}
                        <View style={{
                            flex: 1,
                            backgroundColor: Platform.OS === "web" ? "white" : "transparent",
                            margin: Platform.OS === "web" ? 24 : 0,
                            borderRadius: Platform.OS === "web" ? 32 : 0,
                            shadowColor: "#000",
                            shadowOpacity: Platform.OS === "web" ? 0.05 : 0,
                            shadowRadius: 30,
                            overflow: "hidden",
                            display: "flex"
                        }}>
                            <Container>
                                <Slot />
                            </Container>
                        </View>
                    </View>
                </NavThemeProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
