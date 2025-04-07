import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as SecureStore from "expo-secure-store";

// Dummy data
const DUMMY_STATS = {
  totalUsers: 1234,
  totalScans: 5678,
  todayScans: 123,
};

const DUMMY_USERS = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    active: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    active: true,
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    active: false,
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    active: true,
  },
  {
    id: 5,
    name: "Charlie Wilson",
    email: "charlie@example.com",
    active: false,
  },
];

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [stats, setStats] = React.useState(DUMMY_STATS);
  const [recentUsers, setRecentUsers] = React.useState(DUMMY_USERS);

  const handleToggleUserStatus = (userId) => {
    setRecentUsers((users) =>
      users.map((user) =>
        user.id === userId ? { ...user, active: !user.active } : user
      )
    );
    Alert.alert("Success", "User status updated successfully");
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userDetails");
      navigation.reset({
        index: 0,
        routes: [{ name: "SignIn" }],
      });
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setStats({
        ...DUMMY_STATS,
        todayScans: Math.floor(Math.random() * 200),
      });
      setRefreshing(false);
    }, 1000);
  }, []);

  const StatCard = ({ icon, value, label, color }) => (
    <View style={styles.statCard}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statNumber}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.statusButton,
          { backgroundColor: user.active ? "#50C878" : "#FF6B6B" },
        ]}
        onPress={() => handleToggleUserStatus(user.id)}
      >
        <Text style={styles.statusButtonText}>
          {user.active ? "Active" : "Inactive"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F5F6FA" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.content}
        >
          <View style={styles.statsContainer}>
            <StatCard
              icon="people"
              value={stats.totalUsers}
              label="Total Users"
              color="#4A90E2"
            />
            <StatCard
              icon="image"
              value={stats.totalScans}
              label="Total Scans"
              color="#50C878"
            />
            <StatCard
              icon="today"
              value={stats.todayScans}
              label="Today's Scans"
              color="#FF6B6B"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            {recentUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  safeArea: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E1E1",
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
  },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "white",
    marginVertical: 8,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 8,
    color: "#2D3748",
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2D3748",
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E1E1",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  userEmail: {
    fontSize: 14,
    color: "#718096",
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default DashboardScreen;
