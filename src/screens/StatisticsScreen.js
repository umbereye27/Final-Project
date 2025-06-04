import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const StatisticsScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPrediction, setSelectedPrediction] = useState(null);
    const [predictionResults, setPredictionResults] = useState(null);
    const screenWidth = Dimensions.get("window").width;

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            const response = await fetch("http://192.168.1.64:5001/api/results/statistics");
            const data = await response.json();
            console.log("Statistics data:", data);
            
            if (data.success) {
                setStatistics(data.data);
            } else {
                throw new Error("Failed to fetch statistics");
            }
        } catch (error) {
            console.error("Error fetching statistics:", error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPredictionResults = async (prediction) => {
        setSelectedPrediction(prediction);
        try {
            const response = await fetch(`http://192.168.1.64:5001/api/results?prediction=${prediction}`);
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchStatistics();
    };

    const getChartConfig = () => {
        return {
            backgroundColor: theme.surface,
            backgroundGradientFrom: theme.surface,
            backgroundGradientTo: theme.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(${theme.isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(${theme.isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            style: {
                borderRadius: 16,
            },
            propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: theme.primary,
            },
        };
    };

    const renderDailyTrendsChart = () => {
        if (!statistics || !statistics.dailyTrends || statistics.dailyTrends.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.surface }]}>
                    <Text style={{ color: theme.textSecondary }}>No trend data available</Text>
                </View>
            );
        }

        // Format data for the chart
        const data = {
            labels: statistics.dailyTrends.map(item =>
                `${item._id.month}/${item._id.day}`
            ).slice(-7), // Show last 7 days
            datasets: [
                {
                    data: statistics.dailyTrends.map(item => item.count).slice(-7),
                    color: (opacity = 1) => `rgba(71, 136, 255, ${opacity})`,
                    strokeWidth: 2,
                },
                {
                    data: statistics.dailyTrends.map(item => item.avgConfidence / 20).slice(-7), // Scale down to fit
                    color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
            legend: ["Scans", "Avg. Confidence (÷20)"]
        };

        return (
            <LineChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={getChartConfig()}
                bezier
                style={styles.chart}
            />
        );
    };

    const renderPredictionBreakdownChart = () => {
        if (!statistics || !statistics.predictionBreakdown || statistics.predictionBreakdown.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.surface }]}>
                    <Text style={{ color: theme.textSecondary }}>No prediction data available</Text>
                </View>
            );
        }

        // Format data for the chart
        const data = {
            labels: statistics.predictionBreakdown.map(item => item._id),
            datasets: [
                {
                    data: statistics.predictionBreakdown.map(item => item.count),
                },
            ],
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
                    color: (opacity = 1) => `rgba(71, 136, 255, ${opacity})`,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
            />
        );
    };

    const renderPredictionDistributionChart = () => {
        if (!statistics || !statistics.predictionBreakdown || statistics.predictionBreakdown.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { backgroundColor: theme.surface }]}>
                    <Text style={{ color: theme.textSecondary }}>No distribution data available</Text>
                </View>
            );
        }

        // Generate colors for pie chart
        const generateColor = (index) => {
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#FF595E'
            ];
            return colors[index % colors.length];
        };

        // Format data for the chart
        const data = statistics.predictionBreakdown.map((item, index) => ({
            name: item._id,
            count: item.count,
            color: generateColor(index),
            legendFontColor: theme.isDark ? '#FFF' : '#333',
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

    const renderPredictionDetails = () => {
        if (!predictionResults) return null;

        return (
            <View style={[styles.detailsContainer, { backgroundColor: theme.surface }]}>
                <View style={styles.detailsHeader}>
                    <Text style={[styles.detailsTitle, { color: theme.text }]}>
                        {selectedPrediction} Results
                    </Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setSelectedPrediction(null);
                            setPredictionResults(null);
                        }}
                    >
                        <Icon name="close" size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.detailsSubtitle, { color: theme.textSecondary }]}>
                    Total: {predictionResults.pagination.totalResults} result(s)
                </Text>

                <ScrollView style={styles.resultsList}>
                    {predictionResults.data.map((result, index) => (
                        <View
                            key={result._id}
                            style={[
                                styles.resultItem,
                                { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                            ]}
                        >
                            <View style={styles.resultItemHeader}>
                                <Text style={[styles.resultItemTitle, { color: theme.text }]}>
                                    {result.prediction}
                                </Text>
                                <Text style={[styles.resultItemDate, { color: theme.textSecondary }]}>
                                    {new Date(result.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.resultItemContent}>
                                <Text style={[styles.resultItemLabel, { color: theme.textSecondary }]}>
                                    Confidence:
                                </Text>
                                <Text style={[styles.resultItemValue, { color: theme.text }]}>
                                    {result.confidence.toFixed(2)}%
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                    Loading statistics...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    Analysis Statistics
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
            >
                {/* Overview Cards */}
                <View style={styles.overviewContainer}>
                    <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
                        <Icon name="analytics-outline" size={24} color={theme.primary} style={styles.cardIcon} />
                        <Text style={[styles.cardValue, { color: theme.text }]}>
                            {statistics?.overview?.totalPredictions || 0}
                        </Text>
                        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                            Total Scans
                        </Text>
                    </View>

                    <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
                        <Icon name="checkmark-circle-outline" size={24} color="#4CAF50" style={styles.cardIcon} />
                        <Text style={[styles.cardValue, { color: theme.text }]}>
                            {statistics?.overview?.highConfidencePercentage || "0.00"}%
                        </Text>
                        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                            High Confidence
                        </Text>
                    </View>

                    <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
                        <Icon name="time-outline" size={24} color="#FF9800" style={styles.cardIcon} />
                        <Text style={[styles.cardValue, { color: theme.text }]}>
                            {statistics?.overview?.recentPredictions || 0}
                        </Text>
                        <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                            Recent Scans
                        </Text>
                    </View>
                </View>

                {/* Confidence Stats */}
                <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Confidence Statistics
                    </Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {statistics?.confidenceStats?.avgConfidence?.toFixed(2) || "0.00"}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Average
                            </Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {statistics?.confidenceStats?.maxConfidence?.toFixed(2) || "0.00"}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Highest
                            </Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {statistics?.confidenceStats?.minConfidence?.toFixed(2) || "0.00"}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Lowest
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Daily Trends Chart */}
                <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Daily Scan Trends
                    </Text>
                    {renderDailyTrendsChart()}
                </View>

                {/* Prediction Breakdown */}
                <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Prediction Breakdown
                    </Text>
                    {renderPredictionBreakdownChart()}

                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                        Tap on a prediction type to see details
                    </Text>

                    <View style={styles.predictionList}>
                        {statistics?.predictionBreakdown?.map((item) => (
                            <TouchableOpacity
                                key={item._id}
                                style={[
                                    styles.predictionItem,
                                    { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                                ]}
                                onPress={() => fetchPredictionResults(item._id)}
                            >
                                <View style={styles.predictionItemLeft}>
                                    <Text style={[styles.predictionName, { color: theme.text }]}>
                                        {item._id}
                                    </Text>
                                    <Text style={[styles.predictionCount, { color: theme.textSecondary }]}>
                                        {item.count} scan{item.count !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <View style={styles.predictionItemRight}>
                                    <Text style={[styles.predictionConfidence, { color: theme.primary }]}>
                                        {item.avgConfidence.toFixed(2)}%
                                    </Text>
                                    <Text style={[styles.predictionConfidenceLabel, { color: theme.textSecondary }]}>
                                        avg. confidence
                                    </Text>
                                </View>
                                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Distribution Chart */}
                <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Prediction Distribution
                    </Text>
                    {renderPredictionDistributionChart()}
                </View>
            </ScrollView>

            {/* Prediction Details Modal */}
            {selectedPrediction && renderPredictionDetails()}
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
        marginTop: 12,
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
        marginBottom: 16,
    },
    overviewCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardIcon: {
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 12,
        textAlign: "center",
    },
    sectionCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 8,
        marginBottom: 12,
        textAlign: "center",
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 12,
    },
    chartPlaceholder: {
        height: 200,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    predictionList: {
        marginTop: 8,
    },
    predictionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    predictionItemLeft: {
        flex: 1,
    },
    predictionName: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 2,
    },
    predictionCount: {
        fontSize: 12,
    },
    predictionItemRight: {
        alignItems: "flex-end",
        marginRight: 12,
    },
    predictionConfidence: {
        fontSize: 14,
        fontWeight: "600",
    },
    predictionConfidenceLabel: {
        fontSize: 10,
    },
    detailsContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "70%",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    detailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    closeButton: {
        padding: 8,
    },
    detailsSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    resultsList: {
        maxHeight: "80%",
    },
    resultItem: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    resultItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    resultItemTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    resultItemDate: {
        fontSize: 12,
    },
    resultItemContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    resultItemLabel: {
        fontSize: 12,
        marginRight: 4,
    },
    resultItemValue: {
        fontSize: 14,
        fontWeight: "500",
    },
});

export default StatisticsScreen;