import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    Alert,
    Animated,
    FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../theme/ThemeContext";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get("window");

const StatisticsScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [statistics, setStatistics] = useState(null);
    const [timeBasedStats, setTimeBasedStats] = useState(null);
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('daily');
    const [selectedPrediction, setSelectedPrediction] = useState(null);
    const [predictionResults, setPredictionResults] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    const periods = [
        { key: 'daily', label: 'Daily', icon: 'today' },
        { key: 'weekly', label: 'Weekly', icon: 'calendar' },
        { key: 'monthly', label: 'Monthly', icon: 'calendar-outline' },
        { key: 'yearly', label: 'Yearly', icon: 'calendar-clear' },
    ];

    useEffect(() => {
        loadAllData();

        // Animate entrance
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

    useEffect(() => {
        if (selectedPeriod) {
            fetchTimeBasedStats(selectedPeriod);
        }
    }, [selectedPeriod]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStatistics(),
                fetchTimeBasedStats(selectedPeriod),
            ]);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            Alert.alert("Error", "Failed to load statistics data");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const token = await SecureStore.getItemAsync("userToken");
            const response = await fetch("http://192.168.4.80:5001/api/results/statistics", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (data.success) {
                setStatistics(data.data);
                setTopUsers(data.data.topUsers || []);
            } else {
                throw new Error("Failed to fetch statistics");
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        }
    };

    const fetchTimeBasedStats = async (period) => {
        try {
            const token = await SecureStore.getItemAsync("userToken");
            const response = await fetch(`http://192.168.4.80:5001/api/results/stats/${period}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (data.success) {
                setTimeBasedStats(data.data);
            } else {
                throw new Error(`Failed to fetch ${period} statistics`);
            }
        } catch (error) {
            console.error(`Error fetching ${period} statistics:`, error);
        }
    };

    const fetchPredictionResults = async (prediction) => {
        setSelectedPrediction(prediction);
        try {
            const token = await SecureStore.getItemAsync("userToken");
            const response = await fetch(`http://192.168.4.80:5001/api/results/prediction/${prediction}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (data.success) {
                setPredictionResults(data);
            } else {
                throw new Error("Failed to fetch prediction results");
            }
        } catch (error) {
            console.error("Error fetching prediction results:", error);
            setPredictionResults(null);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    }, [selectedPeriod]);

    const getChartConfig = () => ({
        backgroundColor: theme.surface,
        backgroundGradientFrom: theme.surface,
        backgroundGradientTo: theme.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: theme.primary,
        },
    });

    const StatCard = ({ icon, value, label, color, subtitle, gradient }) => (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <LinearGradient
                colors={gradient || [color, color]}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Icon name={icon} size={28} color="white" style={styles.statIcon} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
                {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
            </LinearGradient>
        </Animated.View>
    );

    const PeriodSelector = () => (
        <Animated.View
            style={[
                styles.periodSelector,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>
                Time Period Analysis
            </Text>
            <View style={styles.periodButtons}>
                {periods.map((period) => (
                    <TouchableOpacity
                        key={period.key}
                        style={[
                            styles.periodButton,
                            {
                                backgroundColor: selectedPeriod === period.key ? theme.primary : theme.surface,
                                borderColor: selectedPeriod === period.key ? theme.primary : theme.border,
                            }
                        ]}
                        onPress={() => setSelectedPeriod(period.key)}
                    >
                        <Icon
                            name={period.icon}
                            size={16}
                            color={selectedPeriod === period.key ? 'white' : theme.text}
                        />
                        <Text style={[
                            styles.periodButtonText,
                            { color: selectedPeriod === period.key ? 'white' : theme.text }
                        ]}>
                            {period.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );

    const renderTimeBasedChart = () => {
        if (!timeBasedStats || !timeBasedStats.timeSeriesData || timeBasedStats.timeSeriesData.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.surface }]}>
                    <Icon name="analytics-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                        No {selectedPeriod} data available
                    </Text>
                </View>
            );
        }

        const formatLabel = (item) => {
            switch (selectedPeriod) {
                case 'daily':
                    return `${item._id.month}/${item._id.day}`;
                case 'weekly':
                    return `W${item._id.week}`;
                case 'monthly':
                    return `${item._id.month}/${item._id.year.toString().slice(-2)}`;
                case 'yearly':
                    return item._id.year.toString();
                default:
                    return '';
            }
        };

        const data = {
            labels: timeBasedStats.timeSeriesData.slice(-10).map(formatLabel),
            datasets: [
                {
                    data: timeBasedStats.timeSeriesData.slice(-10).map(item => item.count),
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                    strokeWidth: 3,
                },
            ],
        };

        return (
            <LineChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={getChartConfig()}
                bezier
                style={styles.chart}
                withDots={true}
                withShadow={false}
                withVerticalLabels={true}
                withHorizontalLabels={true}
            />
        );
    };

    const renderPredictionBreakdownChart = () => {
        if (!statistics?.predictionBreakdown || statistics.predictionBreakdown.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.surface }]}>
                    <Icon name="bar-chart-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                        No prediction data available
                    </Text>
                </View>
            );
        }

        const data = {
            labels: statistics.predictionBreakdown.map(item =>
                item._id.length > 8 ? item._id.substring(0, 8) + '...' : item._id
            ),
            datasets: [{
                data: statistics.predictionBreakdown.map(item => item.count),
            }],
        };

        return (
            <BarChart
                data={data}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                chartConfig={{
                    ...getChartConfig(),
                    barPercentage: 0.7,
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
            />
        );
    };

    const renderPredictionDistributionChart = () => {
        if (!statistics?.predictionBreakdown || statistics.predictionBreakdown.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.surface }]}>
                    <Icon name="pie-chart-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                        No distribution data available
                    </Text>
                </View>
            );
        }

        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

        const data = statistics.predictionBreakdown.map((item, index) => ({
            name: item._id,
            count: item.count,
            color: colors[index % colors.length],
            legendFontColor: theme.text,
            legendFontSize: 12,
        }));

        return (
            <PieChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={getChartConfig()}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chart}
            />
        );
    };

    const TopUserCard = ({ user, index, rank }) => (
        <Animated.View
            style={[
                styles.topUserCard,
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
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{rank}</Text>
            </View>

            <View style={styles.userInfo}>
                <Text style={[styles.topUserName, { color: theme.text }]}>
                    {user.username || 'Unknown User'}
                </Text>
                <Text style={[styles.topUserEmail, { color: theme.textSecondary }]}>
                    {user.email}
                </Text>
                <View style={styles.userStats}>
                    <View style={styles.userStatItem}>
                        <Text style={[styles.userStatValue, { color: theme.primary }]}>
                            {user.count}
                        </Text>
                        <Text style={[styles.userStatLabel, { color: theme.textSecondary }]}>
                            Scans
                        </Text>
                    </View>
                    <View style={styles.userStatItem}>
                        <Text style={[styles.userStatValue, { color: theme.primary }]}>
                            {user.avgConfidence?.toFixed(1) || '0.0'}%
                        </Text>
                        <Text style={[styles.userStatLabel, { color: theme.textSecondary }]}>
                            Avg. Confidence
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[
                styles.roleBadge,
                { backgroundColor: user.role === 'admin' ? '#FF6B6B' : '#4CAF50' }
            ]}>
                <Text style={styles.roleBadgeText}>
                    {user.role?.toUpperCase() || 'USER'}
                </Text>
            </View>
        </Animated.View>
    );

    const PredictionDetailModal = () => {
        if (!selectedPrediction || !predictionResults) return null;

        return (
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.surface,
                            transform: [{
                                translateY: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [300, 0],
                                })
                            }]
                        }
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {selectedPrediction} Results
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setSelectedPrediction(null);
                                setPredictionResults(null);
                            }}
                        >
                            <Icon name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                        Total: {predictionResults.pagination?.totalResults || predictionResults.data?.length || 0} result(s)
                    </Text>

                    <FlatList
                        data={predictionResults.data || []}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View style={[
                                styles.resultItem,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                            ]}>
                                <View style={styles.resultHeader}>
                                    <Text style={[styles.resultPrediction, { color: theme.text }]}>
                                        {item.prediction}
                                    </Text>
                                    <Text style={[styles.resultDate, { color: theme.textSecondary }]}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.resultDetails}>
                                    <Text style={[styles.resultConfidence, { color: theme.primary }]}>
                                        Confidence: {item.confidence?.toFixed(2) || '0.00'}%
                                    </Text>
                                    {item.user && (
                                        <Text style={[styles.resultUser, { color: theme.textSecondary }]}>
                                            User: {item.user.username || item.user.email}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                        style={styles.resultsList}
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                    Loading comprehensive analytics...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    Analytics Dashboard
                </Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                >
                    <Icon name="refresh" size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Overview Statistics */}
                <View style={styles.overviewContainer}>
                    <StatCard
                        icon="analytics"
                        value={statistics?.overview?.totalPredictions || 0}
                        label="Total Predictions"
                        color="#4A90E2"
                        gradient={['#4A90E2', '#357ABD']}
                        subtitle={`${statistics?.overview?.recentPredictions || 0} recent`}
                    />
                    <StatCard
                        icon="checkmark-circle"
                        value={`${statistics?.overview?.highConfidencePercentage || 0}%`}
                        label="High Confidence"
                        color="#50C878"
                        gradient={['#50C878', '#45B565']}
                        subtitle={`${statistics?.overview?.highConfidencePredictions || 0} scans`}
                    />
                    <StatCard
                        icon="people"
                        value={topUsers.length}
                        label="Active Users"
                        color="#FF6B6B"
                        gradient={['#FF6B6B', '#E55A5A']}
                        subtitle="Contributing"
                    />
                </View>

                {/* Confidence Statistics */}
                <Animated.View
                    style={[
                        styles.sectionCard,
                        {
                            backgroundColor: theme.surface,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Confidence Analysis
                    </Text>

                    <View style={styles.confidenceGrid}>
                        <View style={styles.confidenceItem}>
                            <Text style={[styles.confidenceValue, { color: '#4CAF50' }]}>
                                {statistics?.confidenceStats?.avgConfidence?.toFixed(1) || '0.0'}%
                            </Text>
                            <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
                                Average
                            </Text>
                        </View>
                        <View style={styles.confidenceItem}>
                            <Text style={[styles.confidenceValue, { color: '#2196F3' }]}>
                                {statistics?.confidenceStats?.maxConfidence?.toFixed(1) || '0.0'}%
                            </Text>
                            <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
                                Highest
                            </Text>
                        </View>
                        <View style={styles.confidenceItem}>
                            <Text style={[styles.confidenceValue, { color: '#FF9800' }]}>
                                {statistics?.confidenceStats?.minConfidence?.toFixed(1) || '0.0'}%
                            </Text>
                            <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
                                Lowest
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Time-based Analysis */}
                <PeriodSelector />

                <Animated.View
                    style={[
                        styles.sectionCard,
                        {
                            backgroundColor: theme.surface,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Trends
                    </Text>

                    {timeBasedStats?.summary && (
                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>
                                    {timeBasedStats.summary.totalCount || 0}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                    Total Scans
                                </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>
                                    {timeBasedStats.summary.avgConfidence?.toFixed(1) || '0.0'}%
                                </Text>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                    Avg. Confidence
                                </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>
                                    {timeBasedStats.summary.uniqueUserCount || 0}
                                </Text>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                    Unique Users
                                </Text>
                            </View>
                        </View>
                    )}

                    {renderTimeBasedChart()}
                </Animated.View>

                {/* Prediction Breakdown */}
                <Animated.View
                    style={[
                        styles.sectionCard,
                        {
                            backgroundColor: theme.surface,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Prediction Analysis
                    </Text>
                    {renderPredictionBreakdownChart()}

                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                        Tap on a prediction type to view detailed results
                    </Text>

                    <View style={styles.predictionList}>
                        {statistics?.predictionBreakdown?.map((item) => (
                            <TouchableOpacity
                                key={item._id}
                                style={[
                                    styles.predictionItem,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                                ]}
                                onPress={() => fetchPredictionResults(item._id)}
                            >
                                <View style={styles.predictionInfo}>
                                    <Text style={[styles.predictionName, { color: theme.text }]}>
                                        {item._id}
                                    </Text>
                                    <Text style={[styles.predictionCount, { color: theme.textSecondary }]}>
                                        {item.count} scan{item.count !== 1 ? 's' : ''} • {item.uniqueUserCount || 0} user{(item.uniqueUserCount || 0) !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <View style={styles.predictionStats}>
                                    <Text style={[styles.predictionConfidence, { color: theme.primary }]}>
                                        {item.avgConfidence?.toFixed(1) || '0.0'}%
                                    </Text>
                                    <Text style={[styles.predictionRange, { color: theme.textSecondary }]}>
                                        {item.minConfidence?.toFixed(0) || '0'}-{item.maxConfidence?.toFixed(0) || '0'}%
                                    </Text>
                                </View>
                                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* Distribution Chart */}
                <Animated.View
                    style={[
                        styles.sectionCard,
                        {
                            backgroundColor: theme.surface,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Prediction Distribution
                    </Text>
                    {renderPredictionDistributionChart()}
                </Animated.View>

                {/* Top Users */}
                <Animated.View
                    style={[
                        styles.sectionCard,
                        {
                            backgroundColor: theme.surface,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Top Contributors
                    </Text>

                    {topUsers.length > 0 ? (
                        topUsers.slice(0, 5).map((user, index) => (
                            <TopUserCard
                                key={user._id || index}
                                user={user}
                                index={index}
                                rank={index + 1}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Icon name="people-outline" size={48} color={theme.textSecondary} />
                            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                                No user data available
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Prediction Details Modal */}
            <PredictionDetailModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
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
        marginTop: 24, // Increased margin top
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    backButton: {
        padding: 8,
    },
    refreshButton: {
        padding: 8,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 30,
    },
    overviewContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
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
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: 'white',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    statSubtitle: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    sectionCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 12,
        marginBottom: 16,
        textAlign: "center",
    },
    confidenceGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    confidenceItem: {
        flex: 1,
        alignItems: "center",
    },
    confidenceValue: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
    },
    confidenceLabel: {
        fontSize: 12,
    },
    periodSelector: {
        marginBottom: 20,
    },
    periodButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    periodButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 2,
    },
    periodButtonText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 11,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    chartPlaceholder: {
        height: 200,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        marginTop: 8,
        fontSize: 14,
    },
    predictionList: {
        marginTop: 8,
    },
    predictionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    predictionInfo: {
        flex: 1,
    },
    predictionName: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    predictionCount: {
        fontSize: 12,
    },
    predictionStats: {
        alignItems: "flex-end",
        marginRight: 12,
    },
    predictionConfidence: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 2,
    },
    predictionRange: {
        fontSize: 11,
    },
    topUserCard: {
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
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    topUserName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    topUserEmail: {
        fontSize: 12,
        marginBottom: 8,
    },
    userStats: {
        flexDirection: 'row',
    },
    userStatItem: {
        marginRight: 20,
    },
    userStatValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    userStatLabel: {
        fontSize: 10,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        marginTop: 8,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    resultsList: {
        maxHeight: '80%',
    },
    resultItem: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    resultHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    resultPrediction: {
        fontSize: 14,
        fontWeight: "600",
    },
    resultDate: {
        fontSize: 12,
    },
    resultDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    resultConfidence: {
        fontSize: 12,
        fontWeight: "500",
    },
    resultUser: {
        fontSize: 12,
    },
});

export default StatisticsScreen;