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
  const [result, setResult] = useState(null);
  const { theme, isDark } = useTheme();

  // Define your API endpoint - update with your actual server IP
  const API_URL = "http://172.20.10.4:4000/predict";

  // Recommendations for each skin condition
  const recommendations = {
    Chickenpox: {
      description: "Chickenpox is a highly contagious viral infection causing an itchy, blister-like rash.",
      recommendations: [
        "Rest and stay hydrated",
        "Use calamine lotion to reduce itching",
        "Take lukewarm baths with colloidal oatmeal",
        "Avoid scratching to prevent scarring",
        "Consult a doctor for antiviral medications if diagnosed within 24 hours of rash onset"
      ],
      urgency: "medium",
      urgencyMessage: "While usually not dangerous, consult a doctor if severe symptoms develop or if the patient is an adult, pregnant, or has a weakened immune system."
    },
    Cowpox: {
      description: "Cowpox is a rare viral skin infection that causes red blisters, usually from contact with infected animals.",
      recommendations: [
        "Keep the affected area clean and dry",
        "Cover lesions with bandages to prevent spread",
        "Take over-the-counter pain relievers for discomfort",
        "Avoid touching or scratching the lesions",
        "Wash hands thoroughly after touching affected areas"
      ],
      urgency: "low",
      urgencyMessage: "Cowpox typically resolves on its own in 6-12 weeks. Medical attention is needed only if severe symptoms develop."
    },
    Healthy: {
      description: "Your skin appears healthy with no signs of concerning lesions.",
      recommendations: [
        "Continue regular skin care practices",
        "Use sunscreen daily (SPF 30+)",
        "Perform monthly self-examinations of your skin",
        "Stay hydrated and maintain a balanced diet",
        "Consider annual professional skin checks if you have risk factors"
      ],
      urgency: "none",
      urgencyMessage: "No medical attention needed at this time. Continue practicing good skin care."
    },
    HFMD: {
      description: "Hand, Foot, and Mouth Disease (HFMD) is a common viral infection causing sores in the mouth and rashes on hands and feet.",
      recommendations: [
        "Rest and drink plenty of fluids",
        "Use over-the-counter pain relievers for fever and pain",
        "Eat soft foods and avoid acidic or spicy items",
        "Use antiseptic mouthwash if recommended by a doctor",
        "Wash hands frequently to prevent spreading to others"
      ],
      urgency: "medium",
      urgencyMessage: "While usually mild, seek medical care if unable to drink fluids, symptoms worsen after a few days, or in cases of severe symptoms."
    },
    Measles: {
      description: "Measles is a highly contagious viral disease causing a characteristic red rash and fever.",
      recommendations: [
        "Rest in a dark room (light sensitivity is common)",
        "Drink plenty of fluids to prevent dehydration",
        "Take vitamin A supplements if prescribed",
        "Use humidifier to ease cough and sore throat",
        "Stay isolated to prevent spreading to others"
      ],
      urgency: "high",
      urgencyMessage: "Seek immediate medical attention. Measles can lead to serious complications and is a reportable disease."
    },
    Monkeypox: {
      description: "Monkeypox is a viral infection that causes a rash similar to smallpox but generally less severe.",
      recommendations: [
        "Isolate immediately to prevent spread to others",
        "Keep lesions clean and uncovered when alone",
        "Do not share personal items with others",
        "Monitor for fever and other symptoms",
        "Follow healthcare provider instructions carefully"
      ],
      urgency: "high",
      urgencyMessage: "Seek immediate medical attention. Monkeypox requires professional medical management and is a reportable disease."
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case "high":
        return "#FF4040";
      case "medium":
        return "#FFA500";
      case "low":
        return "#4CAF50";
      case "none":
        return "#2196F3";
      default:
        return theme.text;
    }
  };

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        setResult({
          prediction: data.prediction,
          confidence: data.confidence,
        });
        
        console.log("Prediction result:", data);
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

  // Function to reset the results and start over
  const resetResults = () => {
    setImage(null);
    setResult(null);
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

          {/* Results Section */}
          {result && (
            <View style={[styles.resultContainer, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>
                Diagnosis Result:
              </Text>
              <Text style={[styles.resultText, { color: theme.text }]}>
                {result.prediction}
              </Text>
              <Text style={[styles.confidenceText, { color:'yellow' }]}>
                Confidence: {result.confidence}%
              </Text>
              
              {/* Disclaimer */}
              <Text style={[styles.disclaimer, { color: 'white' }]}>
                This is an AI-assisted diagnosis and should not replace professional medical advice.
              </Text>
            </View>
          )}

          {/* Recommendations Section */}
          {result && recommendations[result.prediction] && (
            <View style={[styles.recommendationsContainer, { backgroundColor: theme.secondary }]}>
              <View style={[styles.urgencyBanner, { backgroundColor: getUrgencyColor(recommendations[result.prediction].urgency) }]}>
                <Icon name={recommendations[result.prediction].urgency === "high" ? "alert-circle" : "information-circle"} size={20} color="white" />
                <Text style={styles.urgencyText}>
                  {recommendations[result.prediction].urgencyMessage}
                </Text>
              </View>
              
              <Text style={[styles.recommendationsTitle, { color: theme.text }]}>
                About {result.prediction}
              </Text>
              
              <Text style={[styles.recommendationsDescription, { color: theme.text }]}>
                {recommendations[result.prediction].description}
              </Text>
              
              <Text style={[styles.recommendationsTitle, { color: theme.text, marginTop: 10 }]}>
                Recommendations
              </Text>
              
              {recommendations[result.prediction].recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Icon name="checkmark-circle" size={18} color={theme.primary} style={styles.recommendationIcon} />
                  <Text style={[styles.recommendationText, { color: theme.text }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            {result ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.primary },
                ]}
                onPress={resetResults}
              >
                <Icon
                  name="refresh"
                  size={20}
                  color={theme.buttonText}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                  Scan Another
                </Text>
              </TouchableOpacity>
            ) : (
              <>
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
              </>
            )}
          </View>

          {!result && (
            <Text style={[styles.instructions, { color: theme.textSecondary }]}>
              Upload a proper image to get diagnosis!
            </Text>
          )}
          
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
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
  resultContainer: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  resultText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    
  },
  confidenceText: {
    fontSize: 14,
    marginBottom: 10,
    // color: '#FF0000',
  },
  disclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  recommendationsContainer: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  recommendationsDescription: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  recommendationIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  urgencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  urgencyText: {
    color: "white",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  footerDisclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
});