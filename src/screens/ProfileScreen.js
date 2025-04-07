import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";

const ProfileScreen = ({ navigation }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
  });
  const [editedData, setEditedData] = useState({ ...userData });

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("userToken");
            await SecureStore.deleteItemAsync("userDetails");
            navigation.reset({
              index: 0,
              routes: [{ name: "SignIn" }],
            });
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Add your delete account API call here
            Alert.alert(
              "Account Deleted",
              "Your account has been deleted successfully."
            );
            navigation.reset({
              index: 0,
              routes: [{ name: "SignIn" }],
            });
          },
        },
      ]
    );
  };

  const handleSaveProfile = () => {
    setUserData(editedData);
    setEditModalVisible(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const EditProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Icon name="close" size={24} color="#4A5568" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="person-outline"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A0AEC0"
                  value={editedData.name}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, name: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="mail-outline"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editedData.email}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, email: text })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="call-outline"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="phone-pad"
                  value={editedData.phone}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, phone: text })
                  }
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalDivider} />

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#2D3748" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Icon name="settings-outline" size={24} color="#2D3748" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("../../assets/placeholder.png")}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Icon name="camera-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setEditModalVisible(true)}
          >
            <Icon name="person-outline" size={24} color="#4A5568" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevron-forward" size={24} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="notifications-outline" size={24} color="#4A5568" />
            <Text style={styles.menuText}>Notifications</Text>
            <Icon name="chevron-forward" size={24} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="shield-outline" size={24} color="#4A5568" />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Icon name="chevron-forward" size={24} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help-circle-outline" size={24} color="#4A5568" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Icon name="chevron-forward" size={24} color="#CBD5E0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={24} color="#E53E3E" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={handleDeleteAccount}
          >
            <Icon name="trash-outline" size={24} color="#E53E3E" />
            <Text style={[styles.menuText, styles.deleteText]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <EditProfileModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#3B82F6",
    padding: 8,
    borderRadius: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#718096",
  },
  menuSection: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4A5568",
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 8,
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: "#E53E3E",
  },
  deleteText: {
    color: "#E53E3E",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  closeButton: {
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  modalBody: {
    padding: 20,
    maxHeight: "60%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2D3748",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#EDF2F7",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
  },
  cancelButtonText: {
    color: "#4A5568",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
