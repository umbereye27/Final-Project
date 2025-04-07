import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/typography";

const SettingsScreen = ({ navigation }) => {
  const { theme, themeMode, setThemePreference } = useTheme();

  const ThemeModeSelector = () => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Theme Mode
      </Text>
      {["system", "light", "dark"].map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.themeOption,
            {
              backgroundColor:
                themeMode === mode ? theme.highlight : "transparent",
              borderColor: theme.border,
            },
          ]}
          onPress={() => setThemePreference(mode)}
        >
          <Icon
            name={
              mode === "system"
                ? "phone-portrait-outline"
                : mode === "light"
                ? "sunny-outline"
                : "moon-outline"
            }
            size={24}
            color={theme.text}
          />
          <Text
            style={[
              styles.themeOptionText,
              {
                color: theme.text,
                fontWeight: typography.weights.regular,
              },
              themeMode === mode && { fontWeight: typography.weights.medium },
            ]}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
          {themeMode === mode && (
            <Icon name="checkmark" size={24} color={theme.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View></View>
      </View>
      <ScrollView>
        <ThemeModeSelector />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: 25,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes["2xl"],
  },
  section: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: typography.sizes.base,
    marginLeft: 16,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
  },
});

export default SettingsScreen;
