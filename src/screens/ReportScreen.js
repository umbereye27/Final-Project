import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import DateFilterPanel from '../components/DateFilterPanel';
import { fetchResultsByDateRange, generateDownloadPdfReport } from '../api/apiClient';

const ReportScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);

  const handleFilterApply = async (startDate, endDate) => {
    setLoading(true);
    setFilteredResults([]); // Clear previous results
    
    try {
      console.log("ReportScreen: Applying filter with dates:", startDate, endDate);
      const response = await fetchResultsByDateRange(startDate, endDate, 1, 10);
      
      if (response.success) {
        const totalResults = response.pagination?.totalResults || 0;
        console.log("Filter results:", totalResults);
        
        if (totalResults > 0) {
          setFilteredResults(response.data || []);
          
          // Determine if it's a single day or range (check if dates are on the same day)
          const startDay = new Date(startDate).toLocaleDateString();
          const endDay = new Date(endDate).toLocaleDateString();
          const isSingleDay = startDay === endDay;
          
          const message = isSingleDay 
            ? `Found ${totalResults} results for ${startDay}`
            : `Found ${totalResults} results from ${startDay} to ${endDay}`;
            
          Alert.alert("Results Found", message);
        } else {
          // Create appropriate message for no results
          const startDay = new Date(startDate).toLocaleDateString();
          const endDay = new Date(endDate).toLocaleDateString();
          const isSingleDay = startDay === endDay;
          
          const message = isSingleDay
            ? `No results found for ${startDay}`
            : `No results found from ${startDay} to ${endDay}`;
            
          Alert.alert("No Results", message);
        }
      } else {
        throw new Error(response.message || "Failed to fetch results");
      }
    } catch (error) {
      console.error("Error fetching filtered results:", error);
      Alert.alert("Error", "Failed to fetch results: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (startDate, endDate) => {
    setLoading(true);
    try {
      // Get formatted dates for display
      const startDateFormatted = new Date(startDate).toLocaleDateString();
      const endDateFormatted = new Date(endDate).toLocaleDateString();
      const isSingleDay = startDateFormatted === endDateFormatted;
      const dateRangeText = isSingleDay 
        ? `for ${startDateFormatted}` 
        : `from ${startDateFormatted} to ${endDateFormatted}`;
      
      // Check if we have results to include in the report
      if (filteredResults.length === 0) {
        // First fetch results if not already fetched
        const resultsResponse = await fetchResultsByDateRange(startDate, endDate, 1, 100);
        if (!resultsResponse.success || !resultsResponse.data || resultsResponse.data.length === 0) {
          Alert.alert("No Data", "No results available to generate a PDF report");
          setLoading(false);
          return;
        }
        setFilteredResults(resultsResponse.data);
      }

      // Use the generateDownloadPdfReport function
      const response = await generateDownloadPdfReport(startDate, endDate);
      
      if (response.success) {
        console.log("PDF generation successful:", response);
        // The alert is already handled in the generateDownloadPdfReport function
      } else {
        throw new Error(response.message || "Failed to generate PDF report");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF report: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh logic here if needed
    setRefreshing(false);
  }, []);

  // Function to get the results summary for display and PDF generation
  const getResultsSummary = () => {
    if (!filteredResults || filteredResults.length === 0) {
      return null;
    }

    // Count predictions by type
    const predictionCounts = filteredResults.reduce((acc, result) => {
      const prediction = result.prediction;
      acc[prediction] = (acc[prediction] || 0) + 1;
      return acc;
    }, {});

    // Sort predictions by count (descending)
    const sortedPredictions = Object.entries(predictionCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([prediction, count]) => ({ prediction, count }));

    // Calculate average confidence
    const totalConfidence = filteredResults.reduce((sum, result) => sum + (result.confidence || 0), 0);
    const avgConfidence = totalConfidence / filteredResults.length;

    return {
      totalResults: filteredResults.length,
      predictionCounts: sortedPredictions,
      averageConfidence: avgConfidence.toFixed(2)
    };
  };

  // Add a section to show results summary in the UI
  const renderResultsSummary = () => {
    const summary = getResultsSummary();
    if (!summary) return null;

    return (
      <View style={[styles.summaryContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          Results Summary
        </Text>
        
        <Text style={[styles.summaryText, { color: theme.text }]}>
          Total Results: {summary.totalResults}
        </Text>
        
        <Text style={[styles.summaryText, { color: theme.text }]}>
          Average Confidence: {summary.averageConfidence}%
        </Text>
        
        <Text style={[styles.summarySubTitle, { color: theme.text }]}>
          Results by Condition:
        </Text>
        
        {summary.predictionCounts.map((item, index) => (
          <View key={index} style={styles.predictionRow}>
            <Text style={[styles.predictionName, { color: theme.text }]}>
              {item.prediction}:
            </Text>
            <Text style={[styles.predictionCount, { color: theme.primary }]}>
              {item.count} ({((item.count / summary.totalResults) * 100).toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.surface}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Date Filter Reports</Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          style={styles.scrollView}
        >
          <DateFilterPanel
            onFilterApply={handleFilterApply}
            onGeneratePDF={handleGeneratePDF}
            hasResults={filteredResults.length > 0}
          />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>Processing...</Text>
            </View>
          ) : (
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <Icon name="information-circle-outline" size={24} color={theme.primary} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoText, { color: theme.text }]}>
                  Select a single day or date range above to filter your results.
                </Text>
                <Text style={[styles.infoText, { color: theme.text, marginTop: 8 }]}>
                  Use the Download PDF button to generate a report that will be available for download.
                </Text>
              </View>
            </View>
          )}
          {!loading && filteredResults.length > 0 && (
            <>
              {renderResultsSummary()}
              
              <View style={[styles.resultsContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.resultsTitle, { color: theme.text }]}>
                  Detailed Results ({filteredResults.length})
                </Text>
                
                {filteredResults.map((result, index) => (
                  <View 
                    key={result._id || index} 
                    style={[styles.resultItem, { backgroundColor: theme.background }]}
                  >
                    <View style={styles.resultHeader}>
                      <Text style={[styles.resultPrediction, { color: theme.text }]}>
                        {result.prediction}
                      </Text>
                      <Text style={[styles.resultDate, { color: theme.textSecondary }]}>
                        {new Date(result.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.resultConfidence, { color: theme.primary }]}>
                      Confidence: {result.confidence?.toFixed(2) || '0.00'}%
                    </Text>
                    {result.user && (
                      <Text style={[styles.resultUser, { color: theme.textSecondary }]}>
                        User: {result.user.username} ({result.user.role})
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  resultsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultPrediction: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultDate: {
    fontSize: 14,
  },
  resultConfidence: {
    fontSize: 14,
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
  },
  summarySubTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  predictionName: {
    fontSize: 15,
  },
  predictionCount: {
    fontSize: 15,
    fontWeight: '500',
  },
  resultUser: {
    fontSize: 13,
    marginTop: 4,
  },
});

export default ReportScreen;


