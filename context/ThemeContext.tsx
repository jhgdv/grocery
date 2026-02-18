import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance, Platform } from "react-native";

type ThemeContextType = {
    isDarkMode: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { setColorScheme } = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem("theme");
                const systemScheme = Appearance.getColorScheme();

                let modeToSet = "light";

                if (savedTheme) {
                    modeToSet = savedTheme;
                } else if (systemScheme) {
                    modeToSet = systemScheme;
                }

                const isDark = modeToSet === "dark";
                setIsDarkMode(isDark);

                // NativeWind
                try { setColorScheme(modeToSet as "light" | "dark"); } catch (_) { }

                // Web HTML class
                if (Platform.OS === "web" && typeof document !== "undefined") {
                    if (isDark) {
                        document.documentElement.classList.add("dark");
                    } else {
                        document.documentElement.classList.remove("dark");
                    }
                }
            } catch (error) {
                console.log("Error loading theme:", error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = useCallback(async () => {
        try {
            const newIsDark = !isDarkMode;
            const newTheme = newIsDark ? "dark" : "light";

            // Update state
            setIsDarkMode(newIsDark);

            // NativeWind
            try { setColorScheme(newTheme); } catch (e) { console.log(e); }

            // Web HTML Class (Explicitly add/remove)
            if (Platform.OS === "web" && typeof document !== "undefined") {
                if (newIsDark) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }

            // Persist
            await AsyncStorage.setItem("theme", newTheme);
        } catch (error) {
            console.log("Error toggling theme:", error);
        }
    }, [isDarkMode, setColorScheme]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
