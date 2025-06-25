
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
  StatusBar
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import DateFilterPanel from '../components/DateFilterPanel';
import { fetchResultsByDateRange, generatePDFReport } from '../api/apiClient';

const ReportScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleFilterApply = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await fetchResultsByDateRange(startDate, endDate, 1, 10);
      
      if (response.success) {
        Alert.alert("Success", `Found ${response.pagination?.totalResults || 0} results for the selected date range`);
      } else {
        throw new Error(response.message || "Failed to fetch results");
      }
    } catch (error) {
      console.error("Error fetching filtered results:", error);
      if (error.response?.status === 404) {
        Alert.alert("Info", "No results found for the selected date range");
      } else {
        Alert.alert("Error", "Failed to fetch results");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await generatePDFReport(startDate, endDate);
      Alert.alert("Success", response.message || "PDF report generated and sent to your email");
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF report");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh logic here if needed
    setRefreshing(false);
  }, []);

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
          />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>Processing...</Text>
            </View>
          ) : (
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <Icon name="information-circle-outline" size={24} color={theme.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Select a date range above to filter results or generate a PDF report.
              </Text>
            </View>
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ReportScreen;
