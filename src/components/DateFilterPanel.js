import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const DateFilterPanel = ({ onFilterApply, onGeneratePDF, hasResults = false }) => {
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSingleDayMode, setIsSingleDayMode] = useState(true);

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    
    // If in single day mode, set end date equal to start date
    if (isSingleDayMode) {
      setEndDate(currentDate);
    } 
    // If end date is before start date, update end date
    else if (endDate < currentDate) {
      setEndDate(currentDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  const toggleDayMode = () => {
    setIsSingleDayMode(!isSingleDayMode);
    if (!isSingleDayMode) {
      // When switching to single day mode, set end date equal to start date
      setEndDate(startDate);
    }
  };

  const applyFilter = async () => {
    setIsLoading(true);
    try {
      // Format dates to ISO string
      const formattedStartDate = startDate.toISOString();
      // For single day, add one day to the end date to include all events on that day
      let formattedEndDate;
      if (isSingleDayMode) {
        // Clone the start date and set it to end of day (23:59:59.999)
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        formattedEndDate = endOfDay.toISOString();
      } else {
        // For range mode, set the end date to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        formattedEndDate = endOfDay.toISOString();
      }
      
      console.log("Filtering with dates:", formattedStartDate, formattedEndDate);
      await onFilterApply(formattedStartDate, formattedEndDate);
    } catch (error) {
      console.error("Error in date filter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    setIsLoading(true);
    try {
      // Format dates to ISO string
      const formattedStartDate = startDate.toISOString();
      // Same logic as applyFilter for consistent date handling
      let formattedEndDate;
      if (isSingleDayMode) {
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        formattedEndDate = endOfDay.toISOString();
      } else {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        formattedEndDate = endOfDay.toISOString();
      }
      
      console.log("Generating PDF with dates:", formattedStartDate, formattedEndDate);
      await onGeneratePDF(formattedStartDate, formattedEndDate);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>Date Filter</Text>
      
      <View style={styles.modeToggleContainer}>
        <Text style={[styles.modeText, { color: theme.text }]}>
          {isSingleDayMode ? 'Single Day' : 'Date Range'}
        </Text>
        <Switch
          value={!isSingleDayMode}
          onValueChange={toggleDayMode}
          trackColor={{ false: theme.surface, true: theme.primary }}
          thumbColor={theme.background}
        />
      </View>
      
      <View style={styles.dateContainer}>
        <View style={styles.dateField}>
          <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
            {isSingleDayMode ? 'Select Date' : 'Start Date'}
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: theme.background }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {startDate.toLocaleDateString()}
            </Text>
            <Icon name="calendar-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {!isSingleDayMode && (
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>End Date</Text>
            <TouchableOpacity 
              style={[styles.dateButton, { backgroundColor: theme.background }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.text }]}>
                {endDate.toLocaleDateString()}
              </Text>
              <Icon name="calendar-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={applyFilter}
          disabled={isLoading}
        >
          <Icon name="filter-outline" size={18} color={theme.buttonText} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {isLoading ? 'Loading...' : 'Apply Filter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.button, 
            { 
              backgroundColor: hasResults ? '#4CAF50' : '#A5D6A7',
              opacity: hasResults ? 1 : 0.7
            }
          ]}
          onPress={generatePDF}
          disabled={isLoading || !hasResults}
        >
          <Icon name="download-outline" size={18} color={theme.buttonText} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {isLoading ? 'Generating...' : 'Download PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          maximumDate={new Date()}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default DateFilterPanel;






