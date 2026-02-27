import "../global.css";
import React from "react";
import { Platform, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Slot, usePathname, useRouter, useSegments } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { DefaultTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { BlurView } from "expo-blur";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { Container } from "../components/Container";
import { Sidebar } from "../components/Sidebar";
import { APP_BACKGROUND, palette } from "../lib/design";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

function BottomNavButton({
  icon,
  active,
  onPress,
  primary,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  active: boolean;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        width: primary ? 52 : 44,
        height: primary ? 52 : 44,
        borderRadius: primary ? 26 : 22,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: primary ? 6 : 2,
        backgroundColor: primary ? palette.accent : active ? "rgba(21, 21, 21, 0.08)" : "transparent",
      }}
    >
      <FontAwesome name={icon} size={18} color={primary ? "#fff" : palette.text} />
    </TouchableOpacity>
  );
}

function RootLayoutContent() {
  const { user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();

  const isAuthScreen = segments[0] === "(auth)";
  const showSidebar = Platform.OS === "web" && width > 1080 && !isAuthScreen && !!user;
  const inTabs = pathname === "/" || pathname.startsWith("/(tabs)");
  const showBottomNav = !!user && !isAuthScreen && !showSidebar && inTabs;

  if (loading && !isAuthScreen) {
    return <View style={{ flex: 1, backgroundColor: APP_BACKGROUND }} />;
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: showSidebar ? "row" : "column",
        backgroundColor: APP_BACKGROUND,
      }}
    >
      {showSidebar ? <Sidebar /> : null}
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Container>
          <Slot />
        </Container>
      </View>

      {showBottomNav ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 18,
            alignItems: "center",
          }}
        >
          <View
            style={{
              borderRadius: 34,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <BlurView intensity={70} tint="light">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 7,
                  backgroundColor: "rgba(255,255,255,0.42)",
                }}
              >
                <BottomNavButton
                  icon="home"
                  active={pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index"}
                  onPress={() => router.push("/(tabs)")}
                />
                <BottomNavButton icon="plus" active={false} onPress={() => router.push("/list/create")} primary />
                <BottomNavButton
                  icon="cog"
                  active={pathname.includes("/settings")}
                  onPress={() => router.push("/(tabs)/settings")}
                />
              </View>
            </BlurView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          <NavThemeProvider value={navTheme}>
            <RootLayoutContent />
          </NavThemeProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
