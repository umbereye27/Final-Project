import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../theme/ThemeContext";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [scanStats, setScanStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadDashboardData();
    loadCurrentUser();

    // Animate dashboard entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userDetails = await SecureStore.getItemAsync("userDetails");
      if (userDetails) {
        setCurrentUser(JSON.parse(userDetails));
      }
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchScanStats(),
        fetchRecentUsers(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch("http://192.168.4.80:5001/api/users/stats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.stats) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const fetchScanStats = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch("http://192.168.4.80:5001/api/results/statistics", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success && data.data) {
        setScanStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching scan stats:", error);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch("http://192.168.4.80:5001/api/users?limit=5", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.users) {
        setRecentUsers(data.users.slice(0, 5)); // Show only 5 recent users
      }
    } catch (error) {
      console.error("Error fetching recent users:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
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
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const StatCard = ({ icon, value, label, color, gradient, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient || [color, color]}
        style={styles.statCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statCardContent}>
          <Icon name={icon} size={28} color="white" style={styles.statIcon} />
          <Text style={styles.statNumber}>{value || 0}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ icon, title, subtitle, color, onPress }) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const UserCard = ({ user, index }) => (
    <Animated.View
      style={[
        styles.userCard,
        {
          backgroundColor: theme.surface,
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, 50 + (index * 10)],
            })
          }]
        }
      ]}
    >
      <View style={styles.userAvatar}>
        <Text style={[styles.userAvatarText, { color: theme.primary }]}>
          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>{user.name || 'Unknown User'}</Text>
        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
        <Text style={[styles.userRole, { color: theme.primary }]}>
          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
        </Text>
      </View>
      <View style={[
        styles.statusIndicator,
        { backgroundColor: user.isActive ? '#4CAF50' : '#FF5722' }
      ]} />
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.surface}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              backgroundColor: theme.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {currentUser?.name || 'Admin'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.themeToggle, { backgroundColor: theme.primary + '20' }]}
              onPress={toggleTheme}
            >
              <Icon
                name={isDark ? "sunny" : "moon"}
                size={20}
                color={theme.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: '#FF5722' }]}
              onPress={handleLogout}
            >
              <Icon name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Statistics Cards */}
          <Animated.View
            style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <StatCard
              icon="people"
              value={userStats?.totalUsers}
              label="Total Users"
              color="#4A90E2"
              gradient={['#4A90E2', '#357ABD']}
              onPress={() => navigation.navigate("UserListScreen")}
            />
            <StatCard
              icon="scan"
              value={scanStats?.overview?.totalPredictions}
              label="Total Scans"
              color="#50C878"
              gradient={['#50C878', '#45B565']}
              onPress={() => navigation.navigate("StatisticsScreen")}
            />
            <StatCard
              icon="trending-up"
              value={scanStats?.overview?.recentPredictions}
              label="Recent Scans"
              color="#FF6B6B"
              gradient={['#FF6B6B', '#E55A5A']}
              onPress={() => navigation.navigate("StatisticsScreen")}
            />
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>

            <QuickActionCard
              icon="stats-chart"
              title="View Analytics"
              subtitle="Detailed scan statistics and trends"
              color="#4A90E2"
              onPress={() => navigation.navigate("StatisticsScreen")}
            />

            <QuickActionCard
              icon="people"
              title="Manage Users"
              subtitle="View and manage all users"
              color="#50C878"
              onPress={() => navigation.navigate("UserListScreen")}
            />

            <QuickActionCard
              icon="scan"
              title="New Scan"
              subtitle="Start a new skin lesion analysis"
              color="#FF6B6B"
              onPress={() => navigation.navigate("Home")}
            />
          </Animated.View>

          {/* Recent Users */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Users</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("UserListScreen")}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
                <Icon name="chevron-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {recentUsers.length > 0 ? (
              recentUsers.map((user, index) => (
                <UserCard key={user._id || user.id || index} user={user} index={index} />
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <Icon name="people-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No users found
                </Text>
              </View>
            )}
          </Animated.View>

          {/* System Overview */}
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>System Overview</Text>

            <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
              <View style={styles.overviewItem}>
                <Icon name="shield-checkmark" size={20} color="#4CAF50" />
                <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>System Status</Text>
                <Text style={[styles.overviewValue, { color: '#4CAF50' }]}>Healthy</Text>
              </View>

              <View style={styles.overviewDivider} />

              <View style={styles.overviewItem}>
                <Icon name="analytics" size={20} color="#2196F3" />
                <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Accuracy Rate</Text>
                <Text style={[styles.overviewValue, { color: theme.text }]}>
                  {scanStats?.confidenceStats?.avgConfidence?.toFixed(1) || '0.0'}%
                </Text>
              </View>

              <View style={styles.overviewDivider} />

              <View style={styles.overviewItem}>
                <Icon name="people" size={20} color="#FF9800" />
                <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Active Users</Text>
                <Text style={[styles.overviewValue, { color: theme.text }]}>
                  {userStats?.userCount || 0}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    padding: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statCardContent: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
  overviewCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  overviewLabel: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  overviewDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 32,
  },
});

export default DashboardScreen;