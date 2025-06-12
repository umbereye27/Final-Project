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
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";
import * as FileSystem from "expo-file-system";

export default function SkinLesionDetectorApp({ navigation }) {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDark } = useTheme();

  // Define your API endpoint - update with your actual server IP
  const API_URL = "http://192.168.1.64:4000/predict";

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
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage({ uri: result.assets[0].uri });
        // Upload image to server
        await uploadImage(result.assets[0].uri);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
      setIsLoading(false);
    }
  };

  const uploadImage = async (uri) => {
    try {
      // Create form data
      const formData = new FormData();

      // Get file name from URI
      const uriParts = uri.split('/');
      const fileName = uriParts[uriParts.length - 1];

      // Get file type
      const fileType = fileName.split('.')[1];

      // Append file to form data
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileType}`,
      });

      // Send request to server
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Check if request was successful
      if (response.ok) {
        const data = await response.json();

        console.log("Prediction result:", data);

        // Navigate to result screen with prediction data
        navigation.navigate("ResultScreen", {
          prediction: data.prediction,
          confidence: data.confidence,
          imageUri: uri
        });
      } else {
        throw new Error('Server returned an error');
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(
        "Upload Error",
        "Failed to get prediction from server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to take picture from camera
  const takePicture = async () => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera permissions to make this work!"
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage({ uri: result.assets[0].uri });
        // Upload image to server
        await uploadImage(result.assets[0].uri);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture");
      setIsLoading(false);
    }
  };

  // Function to navigate to statistics screen
  const goToStatistics = () => {
    navigation.navigate("StatisticsScreen");
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
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

          {/* Buttons Section */}
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

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary, marginTop: 10 },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={takePicture}
              disabled={isLoading}
            >
              <Icon
                name="camera"
                size={20}
                color={theme.buttonText}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.secondary, marginTop: 20 },
              ]}
              onPress={goToStatistics}
            >
              <Icon
                name="stats-chart"
                size={20}
                color={theme.text}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, { color: theme.text }]}>
                View Statistics
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.instructions, { color: theme.textSecondary }]}>
            Upload a proper image to get diagnosis!
          </Text>

          {/* Footer disclaimer */}
          <Text style={[styles.footerDisclaimer, { color: theme.textSecondary }]}>
            This app does not provide medical advice. Always consult a qualified healthcare professional for proper diagnosis and treatment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    flexGrow: 1,
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
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
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
  footerDisclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
});