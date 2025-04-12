import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import axios from "axios";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONSTANTS,
} from "../config/constants";
import apiClient, { authService } from "../api/apiClient";

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: APP_CONSTANTS.DEFAULT_ROLE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (
      !formData.username ||
      formData.username.length < APP_CONSTANTS.MIN_USERNAME_LENGTH
    ) {
      Alert.alert(
        "Error",
        `Username must be at least ${APP_CONSTANTS.MIN_USERNAME_LENGTH} characters long`
      );
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    if (!passwordRegex.test(formData.password)) {
      Alert.alert(
        "Error",
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character"
      );
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log("Form Data being sent:", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      const response = await authService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.role
      );

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") },
      ]);
    } catch (error) {
      console.error("Signup Error:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const RolePickerModal = () => (
    <Modal
      visible={showRolePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRolePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Role</Text>
          {APP_CONSTANTS.ROLES.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleOption,
                formData.role === role.value && styles.selectedRole,
              ]}
              onPress={() => {
                setFormData({ ...formData, role: role.value });
                setShowRolePicker(false);
              }}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  formData.role === role.value && styles.selectedRoleText,
                ]}
              >
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowRolePicker(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitleText}>
            Join our community of skin health enthusiasts
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={formData.username}
              onChangeText={(text) =>
                setFormData({ ...formData, username: text })
              }
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.roleSelector}
            onPress={() => setShowRolePicker(true)}
          >
            <Text style={styles.roleSelectorText}>
              {APP_CONSTANTS.ROLES.find((r) => r.value === formData.role)
                ?.label || "Select Role"}
            </Text>
          </TouchableOpacity>

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
            />
          </View>

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.loginLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <RolePickerModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'black',
  },
  passwordInputContainer: {
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
    fontSize: 16,
  },
  eyeIconContainer: {
    padding: 10,
  },
  passwordRequirements: {
    marginBottom: 20,
  },
  requirementText: {
    color: "gray",
    marginBottom: 5,
    fontSize: 12,
  },
  signUpButton: {
    backgroundColor: "#5E9FF4",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "gray",
  },
  loginLinkText: {
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
  buttonDisabled: {
    opacity: 0.5,
  },
  roleSelector: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  roleSelectorText: {
    fontSize: 16,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  roleOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectedRole: {
    backgroundColor: "#E8F5E9",
  },
  roleOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedRoleText: {
    color: "#8BC34A",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SignUpScreen;
