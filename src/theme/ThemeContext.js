import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";
import { typography } from "./typography";

export const lightTheme = {
  background: "#F3F4F6",
  surface: "#FFFFFF",
  surfaceSecondary: "#F8FAFC",
  primary: "#3B82F6",
  secondary: "#89CFF0",
  text: "#1E3A8A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#FF6B6B",
  success: "#50C878",
  warning: "#FFA500",
  buttonText: "#FFFFFF",
  disabled: "rgba(0, 0, 0, 0.12)",
  card: "#FFFFFF",
  shadow: "rgba(0, 0, 0, 0.1)",
  placeholder: "#A0AEC0",
  highlight: "#EEF2FF",
  typography: {
    sizes: typography.sizes,
    weights: typography.weights,
    families: typography.families,
  },
};

export const darkTheme = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceSecondary: "#2D3748",
  primary: "#60A5FA",
  secondary: "#60A5FA",
  text: "#FFFFFF",
  textSecondary: "#A0AEC0",
  border: "#2D3748",
  error: "#FF6B6B",
  success: "#50C878",
  warning: "#FFA500",
  buttonText: "#FFFFFF",
  disabled: "rgba(255, 255, 255, 0.12)",
  card: "#2D3748",
  shadow: "rgba(0, 0, 0, 0.3)",
  placeholder: "#718096",
  highlight: "#2C5282",
  typography: {
    sizes: typography.sizes,
    weights: typography.weights,
    families: typography.families,
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [themeMode, setThemeMode] = useState("system"); // 'system', 'light', or 'dark'

  useEffect(() => {
    loadThemePreference();

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === "system") {
        setIsDark(colorScheme === "dark");
      }
    });

    return () => {
      subscription.remove();
    };
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await SecureStore.getItemAsync("themeMode");
      if (savedThemeMode) {
        setThemeMode(savedThemeMode);
        setIsDark(
          savedThemeMode === "system"
            ? systemColorScheme === "dark"
            : savedThemeMode === "dark"
        );
      } else {
        setThemeMode("system");
        setIsDark(systemColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      setIsDark(systemColorScheme === "dark");
    }
  };

  const setThemePreference = async (mode) => {
    try {
      await SecureStore.setItemAsync("themeMode", mode);
      setThemeMode(mode);
      setIsDark(
        mode === "system" ? systemColorScheme === "dark" : mode === "dark"
      );
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    await setThemePreference(newTheme ? "dark" : "light");
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        themeMode,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

