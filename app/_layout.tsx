import "../global.css";
import React from "react";
import { Platform, View, TouchableOpacity, useWindowDimensions } from "react-native";
import { Slot, useSegments, usePathname, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Container } from "../components/Container";
import { Sidebar } from "../components/Sidebar";
import { FontAwesome } from "@expo/vector-icons";
import { DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";

const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "transparent",
    },
};

function NavButton({ icon, active, onPress, isPrimary }: { icon: string; active: boolean; onPress: () => void; isPrimary?: boolean }) {
    if (isPrimary) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: "#6BA0D8",
                    // @ts-ignore
                    background: "linear-gradient(135deg, #6BA0D8 0%, #2D5BA3 100%)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginHorizontal: 6,
                    shadowColor: "#6BA0D8",
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                }}
            >
                <FontAwesome name={icon as any} size={20} color="white" />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                marginHorizontal: 4,
                backgroundColor: active ? "rgba(107, 160, 216, 0.18)" : "transparent",
            }}
        >
            <FontAwesome
                name={icon as any}
                size={20}
                color={active ? "#91BBE6" : "rgba(255,255,255,0.55)"}
            />
        </TouchableOpacity>
    );
}

function RootLayoutContent() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const pathname = usePathname();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const isAuthScreen = segments[0] === "(auth)";
    const showSidebar = Platform.OS === "web" && width > 768 && !isAuthScreen && user;
    const showBottomNav = !showSidebar && !isAuthScreen && !!user;

    const isHome = pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index";
    const isSettings = pathname.includes("settings");

    if (loading && !user && !isAuthScreen) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: "#E8F2FF",
                // @ts-ignore
                background: "linear-gradient(160deg, #E8F2FF 0%, #EDE8FF 100%)",
            }} />
        );
    }

    return (
        <View style={{
            flex: 1,
            flexDirection: showSidebar ? "row" : "column",
            backgroundColor: "#E8F2FF",
            // @ts-ignore
            background: "linear-gradient(160deg, #E8F2FF 0%, #EDE8FF 100%)",
        }}>
            {showSidebar && <Sidebar />}
            <View style={{ flex: 1, overflow: "hidden" }}>
                <Container style={!showSidebar ? { maxWidth: 550 } : undefined}>
                    <Slot />
                </Container>
            </View>

            {showBottomNav && (
                <View style={{
                    position: "absolute",
                    bottom: 24,
                    left: 0,
                    right: 0,
                    alignItems: "center",
                    zIndex: 100,
                    // @ts-ignore
                    pointerEvents: "box-none",
                }}>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "rgba(15, 25, 55, 0.88)",
                        // @ts-ignore
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        borderRadius: 36,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        shadowColor: "#000",
                        shadowOpacity: 0.4,
                        shadowRadius: 28,
                        shadowOffset: { width: 0, height: 10 },
                    }}>
                        <NavButton
                            icon="home"
                            active={isHome}
                            onPress={() => router.push("/(tabs)")}
                        />
                        <NavButton
                            icon="plus"
                            active={false}
                            onPress={() => router.push("/list/create")}
                            isPrimary
                        />
                        <NavButton
                            icon="cog"
                            active={isSettings}
                            onPress={() => router.push("/(tabs)/settings")}
                        />
                    </View>
                </View>
            )}
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
