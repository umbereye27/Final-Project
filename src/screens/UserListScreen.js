import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Alert,
    TextInput,
    ActivityIndicator,
    Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../theme/ThemeContext";

const UserListScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const [userStats, setUserStats] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        loadUsers();
        loadUserStats();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchQuery, selectedRole]);

    const loadUsers = async () => {
        try {
            const token = await SecureStore.getItemAsync("userToken");
            const response = await fetch("http://192.168.4.80:5001/api/users/all", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const loadUserStats = async () => {
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

    const filterUsers = () => {
        let filtered = users;

        // Filter by role
        if (selectedRole !== "all") {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadUsers(), loadUserStats()]);
        setRefreshing(false);
    }, []);

    const RoleFilter = ({ role, label, count }) => (
        <TouchableOpacity
            style={[
                styles.roleFilter,
                {
                    backgroundColor: selectedRole === role ? theme.primary : theme.surface,
                    borderColor: selectedRole === role ? theme.primary : theme.border,
                }
            ]}
            onPress={() => setSelectedRole(role)}
        >
            <Text style={[
                styles.roleFilterText,
                { color: selectedRole === role ? 'white' : theme.text }
            ]}>
                {label}
            </Text>
            {count !== undefined && (
                <View style={[
                    styles.roleFilterBadge,
                    { backgroundColor: selectedRole === role ? 'rgba(255,255,255,0.3)' : theme.primary }
                ]}>
                    <Text style={[
                        styles.roleFilterBadgeText,
                        { color: selectedRole === role ? 'white' : 'white' }
                    ]}>
                        {count}
                    </Text>
                </View>
            )}
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
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                        })
                    }]
                }
            ]}
        >
            <View style={styles.userCardHeader}>
                <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.userAvatarText, { color: theme.primary }]}>
                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.text }]}>
                        {user.username || 'Unknown User'}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                        {user.email}
                    </Text>
                    <View style={styles.userMeta}>
                        <View style={[
                            styles.roleBadge,
                            { backgroundColor: user.role === 'admin' ? '#FF6B6B' : '#4CAF50' }
                        ]}>
                            <Text style={styles.roleBadgeText}>
                                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                            </Text>
                        </View>
                        <Text style={[styles.joinDate, { color: theme.textSecondary }]}>
                            Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.userActions}>
                    <View style={[
                        styles.statusIndicator,
                        { backgroundColor: user.isActive ? '#4CAF50' : '#FF5722' }
                    ]} />
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => showUserDetails(user)}
                    >
                        <Icon name="information-circle" size={20} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    const showUserDetails = (user) => {
        Alert.alert(
            "User Details",
            `Name: ${user.username || 'N/A'}\nEmail: ${user.email}\nRole: ${user.role || 'user'}\nJoined: ${new Date(user.createdAt || Date.now()).toLocaleDateString()}`,
            [{ text: "OK" }]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>Loading Users...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        User Management
                    </Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Stats Overview */}
                <Animated.View
                    style={[
                        styles.statsOverview,
                        { backgroundColor: theme.surface, opacity: fadeAnim }
                    ]}
                >
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>
                            {userStats?.totalUsers || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                            Total Users
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>
                            {userStats?.adminCount || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                            Admins
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>
                            {userStats?.userCount || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                            Regular Users
                        </Text>
                    </View>
                </Animated.View>

                {/* Search and Filters */}
                <Animated.View
                    style={[styles.searchContainer, { opacity: fadeAnim }]}
                >
                    <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
                        <Icon name="search" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search users..."
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Icon name="close-circle" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <View style={styles.roleFilters}>
                        <RoleFilter role="all" label="All" count={users.length} />
                        <RoleFilter role="admin" label="Admins" count={userStats?.adminCount} />
                        <RoleFilter role="user" label="Users" count={userStats?.userCount} />
                    </View>
                </Animated.View>

                {/* User List */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id || item.id || item.email}
                    renderItem={({ item, index }) => <UserCard user={item} index={index} />}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                            <Icon name="people-outline" size={64} color={theme.textSecondary} />
                            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                                No Users Found
                            </Text>
                            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                                {searchQuery || selectedRole !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "No users have been registered yet"
                                }
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
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
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    backButton: {
        padding: 8,
    },
    placeholder: {
        width: 40,
    },
    statsOverview: {
        flexDirection: 'row',
        paddingVertical: 20,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginVertical: 8,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    roleFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roleFilter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 4,
    },
    roleFilterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    roleFilterBadge: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    roleFilterBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    userCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 8,
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    roleBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    joinDate: {
        fontSize: 12,
    },
    userActions: {
        alignItems: 'center',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
    },
    emptyState: {
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default UserListScreen;