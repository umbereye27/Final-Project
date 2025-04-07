import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";

export default function SkinLesionDetectorApp({ navigation }) {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDark } = useTheme();

  const pickImage = async () => {
    setIsLoading(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        setImage({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Navigation Header */}
      <View style={[styles.header, { backgroundColor: "transparent" }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon name="person-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Skin Lesion Detector
        </Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Icon name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <View style={[styles.circleBg, { backgroundColor: theme.secondary }]}>
            <View style={[styles.circleInner, { borderColor: theme.primary }]}>
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} />
              ) : (
                <Image
                  source={image || require("../../assets/placeholder.png")}
                  style={styles.image}
                  resizeMode={image ? "cover" : "contain"}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={pickImage}
            disabled={isLoading}
          >
            <Icon
              name="image"
              size={20}
              color={theme.buttonText}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              {isLoading ? "Processing..." : "Choose Image"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.instructions, { color: theme.textSecondary }]}>
          Upload proper image to get diagnosis!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  circleBg: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circleInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  instructions: {
    marginTop: 10,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
