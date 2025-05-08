import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import apiClient, { authService } from "../api/apiClient";

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const navigation = useNavigation();

  const mutation = useMutation({
    mutationFn: async ({ email, password }) => {
      return await authService.login(email, password);
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync("userToken", data.token);
      await SecureStore.setItemAsync("userDetails", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigation.replace("Dashboard");
      } else {
        navigation.replace("Home");
      }
    },
    onError: (error) => {
      const errorMsg =
        error.response?.data?.message || "Sign-in failed. Please try again.";
      Alert.alert("Sign In Error", errorMsg);
      console.error(
        "Sign-in error details:",
        error.response?.data || error.message
      );
    },
  });

  const handleSignIn = () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Please enter both email and password");
      return;
    }

    mutation.mutate({ email, password });
  };

  const handleSocialLogin = (platform) => {
    Alert.alert("Social Login", `Attempting to login with ${platform}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.subtitleText}>
          Sign in to access all functionality of our App!
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin("Apple")}
          >
            <Image
              source={require("../../assets/Apple-Logo.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Login with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin("Google")}
          >
            <Image
              source={require("../../assets/google.webp")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Login with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#888" 
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#888" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeIcon}
          >
            <Text>{passwordVisible ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleSignIn}
          disabled={mutation.isLoading}
        >
          <Text style={styles.loginButtonText}>
            {mutation.isLoading ? "Logging in..." : "SignIn"}
          </Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signupLinkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  logo: {
    width: 150,
    height: 50,
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 30,
    padding: 20,
    fontWeight: "900",
    color: "#151B5E",
    fontFamily: "Poltawski Nowy",
  },
  subtitleText: {
    fontSize: 14,
    color: "gray",
    marginTop: 10,
    textAlign: "center",
  },
  formContainer: {
    marginTop: 30,
    padding: 20,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 10,
    width: "48%",
  },
  socialIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  socialButtonText: {
    color: "black",
    fontSize: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "gray",
    fontWeight: 500,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
  },
  eyeIcon: {
    padding: 10,
  
  },
  forgotPasswordText: {
    alignSelf: "flex-end",
    color: "black",
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#5E9FF4",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    color: "gray",
    fontWeight: 500,
  },
  signupLinkText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  termsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  termsText: {
    color: "gray",
    textAlign: "center",
    fontSize: 12,
  },
  termsLinkText: {
    color: "#007bff",
  },
});

export default SignInScreen;
