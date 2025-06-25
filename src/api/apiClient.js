import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert, Linking } from 'react-native';

export const API_URL = "http://172.20.10.4:5001/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error accessing secure storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/auth/signin", {
        email,
        password,
      });
      console.log("Response", response.data);

      if (!response.data.user.role) {
        throw new Error("User role not specified in response");
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userDetails");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  register: async (username, email, password, confirmPassword, role) => {
    try {
      const response = await apiClient.post("/auth/signup", {
        username,
        email,
        confirmPassword,
        password,
        role,
      });
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  isAuthenticated: async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      return !!token;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  },
};

const fetchResultsByDateRange = async (startDate, endDate, page = 1, limit = 10) => {
  try {
    console.log("API call with dates:", startDate, endDate);
    
    // Check if this URL matches your backend API endpoint
    // It should be the same as what's used in your backend
    const url = `${API_URL}/results/date?startDate=${startDate}&endDate=${endDate}`;
    console.log("API URL:", url);
    
    const token = await SecureStore.getItemAsync("userToken");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Log the raw response
    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("API response data:", data);
    
    return data;
  } catch (error) {
    console.error('Error fetching results by date range:', error);
    throw error;
  }
};

const generatePDFReport = async (startDate, endDate) => {
  try {
    console.log("Generating PDF report with dates:", startDate, endDate);
    
    // First, fetch the results data for the date range if needed
    const resultsResponse = await fetchResultsByDateRange(startDate, endDate, 1, 100); // Get up to 100 results
    
    if (!resultsResponse.success || !resultsResponse.data || resultsResponse.data.length === 0) {
      return {
        success: false,
        message: "No results available to generate PDF"
      };
    }
    
    console.log(`Generating PDF for ${resultsResponse.data.length} results`);
    
    const token = await SecureStore.getItemAsync("userToken");
    const response = await fetch(`${API_URL}/results/generate-pdf`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        startDate, 
        endDate,
        results: resultsResponse.data // Include the results data directly
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    // Assume the response is JSON containing a URL or success message
    const data = await response.json();
    console.log("PDF generation response:", data);
    
    // Return the response with a success flag
    return {
      ...data,
      success: true
    };
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return {
      success: false,
      message: error.message || "Failed to generate PDF report"
    };
  }
};

const generateDownloadPdfReport = async (startDate, endDate) => {
  try {
    console.log("Generating downloadable PDF report with dates:", startDate, endDate);
    
    const token = await SecureStore.getItemAsync("userToken");
    
    // Create parameters string
    let paramsString = `startDate=${encodeURIComponent(startDate)}`;
    if (endDate) {
      paramsString += `&endDate=${encodeURIComponent(endDate)}`;
    }
    
    // Format dates for display
    const startDateFormatted = new Date(startDate).toLocaleDateString();
    const endDateFormatted = new Date(endDate).toLocaleDateString();
    const isSingleDay = startDateFormatted === endDateFormatted;
    const dateRangeText = isSingleDay 
      ? `for ${startDateFormatted}` 
      : `from ${startDateFormatted} to ${endDateFormatted}`;
    
    // Generate the download URL
    const downloadUrl = `${API_URL}/results/download-report?${paramsString}&token=${token}`;
    
    // Display an alert to inform the user
    Alert.alert(
      "Download Report",
      `Your PDF report ${dateRangeText} will open in your browser. Please check your browser to download the file.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Download",
          onPress: async () => {
            console.log("Opening download URL:", downloadUrl);
            
            const canOpen = await Linking.canOpenURL(downloadUrl);
            if (canOpen) {
              await Linking.openURL(downloadUrl);
            } else {
              Alert.alert("Error", "Cannot open browser to download the file");
            }
          }
        }
      ]
    );
    
    return {
      success: true,
      message: "Download initiated. Please check your browser."
    };
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return {
      success: false,
      message: error.message || "Failed to generate PDF report"
    };
  }
};

export {
  apiClient as default,
  fetchResultsByDateRange,
  generatePDFReport,
  generateDownloadPdfReport,
  // API_URL
};
