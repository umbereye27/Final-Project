"use client"

import { useState } from "react"
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
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import Icon from "react-native-vector-icons/Ionicons"
import * as SecureStore from "expo-secure-store"
import { useTheme } from "../theme/ThemeContext"

export default function SkinLesionDetectorApp({ navigation }) {
  const [image, setImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Processing...")
  const { theme, isDark } = useTheme()

  // Define your API endpoints
  const PREDICTION_API_URL = "http://192.168.4.80:4000/predict"
  const SAVE_RESULT_API_URL = "http://192.168.4.80:5001/api/results"

  const pickImage = async () => {
    setIsLoading(true)
    setLoadingMessage("Preparing image...")

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!")
        setIsLoading(false)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        setImage({ uri: result.assets[0].uri })
        // Process image and save result
        await processImageAndSave(result.assets[0].uri)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image from gallery")
      setIsLoading(false)
    }
  }

  const takePicture = async () => {
    setIsLoading(true)
    setLoadingMessage("Preparing camera...")

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera permissions to make this work!")
        setIsLoading(false)
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        setImage({ uri: result.assets[0].uri })
        // Process image and save result
        await processImageAndSave(result.assets[0].uri)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error taking picture:", error)
      Alert.alert("Error", "Failed to take picture")
      setIsLoading(false)
    }
  }

  const processImageAndSave = async (uri) => {
    try {
      // Step 1: Get prediction from AI model
      setLoadingMessage("Analyzing image with AI...")
      const predictionData = await getPrediction(uri)

      if (!predictionData) {
        throw new Error("Failed to get prediction")
      }

      // Step 2: Save result to database
      setLoadingMessage("Saving results...")
      const saveSuccess = await saveResult(predictionData)

      // Step 3: Navigate to result screen
      setLoadingMessage("Preparing results...")
      navigation.navigate("ResultScreen", {
        prediction: predictionData.prediction,
        confidence: predictionData.confidence,
        imageUri: uri,
        isSaved: saveSuccess,
        saveMessage: saveSuccess ? "Results saved successfully" : "Failed to save results",
      })
    } catch (error) {
      console.error("Error processing image:", error)
      Alert.alert("Processing Error", "Failed to process image. Please try again.", [{ text: "OK" }])
    } finally {
      setIsLoading(false)
      setLoadingMessage("Processing...")
    }
  }

  const getPrediction = async (uri) => {
    try {
      // Create form data
      const formData = new FormData()

      // Get file name from URI
      const uriParts = uri.split("/")
      const fileName = uriParts[uriParts.length - 1]

      // Get file type
      const fileType = fileName.split(".")[1]

      // Append file to form data
      formData.append("file", {
        uri,
        name: fileName,
        type: `image/${fileType}`,
      })

      // Send request to prediction server
      const response = await fetch(PREDICTION_API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Prediction result:", data)
        return data
      } else {
        throw new Error("Prediction server returned an error")
      }
    } catch (error) {
      console.error("Error getting prediction:", error)
      throw error
    }
  }

  const saveResult = async (predictionData) => {
    try {
      // Get authentication token
      const token = await SecureStore.getItemAsync("userToken")

      if (!token) {
        console.log("No authentication token found - user not logged in")
        // Still allow viewing results, but mark as not saved
        return false
      }

      // Save result to database
      const response = await fetch(SAVE_RESULT_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confidence: predictionData.confidence,
          prediction: predictionData.prediction,
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("Result saved successfully:", data)
        return true
      } else {
        console.error("Failed to save result:", data.message)
        return false
      }
    } catch (error) {
      console.error("Error saving result:", error)
      return false
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Navigation Header */}
      <View style={[styles.header, { backgroundColor: "transparent" }]}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Profile")}>
          <Icon name="person-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Skin Lesion Detector</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <View style={[styles.circleBg, { backgroundColor: theme.secondary }]}>
              <View style={[styles.circleInner, { borderColor: theme.primary }]}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>{loadingMessage}</Text>
                  </View>
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

          {/* Processing Steps Indicator */}
          {isLoading && (
            <View style={[styles.stepsContainer, { backgroundColor: theme.surface }]}>
              <View style={styles.stepItem}>
                <Icon
                  name="camera"
                  size={16}
                  color={loadingMessage.includes("Preparing") ? theme.primary : "#4CAF50"}
                />
                <Text
                  style={[styles.stepText, { color: loadingMessage.includes("Preparing") ? theme.primary : "#4CAF50" }]}
                >
                  Image Captured
                </Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepItem}>
                <Icon
                  name="brain"
                  size={16}
                  color={
                    loadingMessage.includes("Analyzing")
                      ? theme.primary
                      : loadingMessage.includes("Saving") || loadingMessage.includes("Preparing results")
                        ? "#4CAF50"
                        : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: loadingMessage.includes("Analyzing")
                        ? theme.primary
                        : loadingMessage.includes("Saving") || loadingMessage.includes("Preparing results")
                          ? "#4CAF50"
                          : theme.textSecondary,
                    },
                  ]}
                >
                  AI Analysis
                </Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepItem}>
                <Icon
                  name="save"
                  size={16}
                  color={
                    loadingMessage.includes("Saving")
                      ? theme.primary
                      : loadingMessage.includes("Preparing results")
                        ? "#4CAF50"
                        : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: loadingMessage.includes("Saving")
                        ? theme.primary
                        : loadingMessage.includes("Preparing results")
                          ? "#4CAF50"
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Saving Results
                </Text>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.stepItem}>
                <Icon
                  name="document-text"
                  size={16}
                  color={loadingMessage.includes("Preparing results") ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.stepText,
                    { color: loadingMessage.includes("Preparing results") ? theme.primary : theme.textSecondary },
                  ]}
                >
                  Report Ready
                </Text>
              </View>
            </View>
          )}

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Icon name="image" size={20} color={theme.buttonText} style={styles.buttonIcon} />
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
              <Icon name="camera" size={20} color={theme.buttonText} style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.instructions, { color: theme.textSecondary }]}>
            Upload a proper image to get diagnosis!
          </Text>

          {/* Process Info */}
          <View style={[styles.processInfo, { backgroundColor: theme.surface }]}>
            <Icon name="information-circle" size={16} color={theme.primary} />
            <Text style={[styles.processInfoText, { color: theme.textSecondary }]}>
              Your results will be automatically analyzed and saved to your profile
            </Text>
          </View>

          {/* Footer disclaimer */}
          <Text style={[styles.footerDisclaimer, { color: theme.textSecondary }]}>
            This app does not provide medical advice. Always consult a qualified healthcare professional for proper
            diagnosis and treatment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  stepDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 8,
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
  processInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 20,
  },
  processInfoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    textAlign: "center",
  },
  footerDisclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
})
