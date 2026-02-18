import "../global.css";
import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Container } from "../components/Container";
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
                    <Container>
                        <Slot />
                    </Container>
                </NavThemeProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
