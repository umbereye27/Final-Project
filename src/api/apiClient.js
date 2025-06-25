import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://172.20.10.7:5001/api";

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
    const response = await apiClient.get('/results/date-range', {
      params: {
        startDate,
        endDate,
        page,
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching results by date range:', error);
    throw error;
  }
};

const generatePDFReport = async (startDate, endDate) => {
  try {
    const token = await SecureStore.getItemAsync("userToken");
    const response = await fetch("http://172.20.10.7:5001/api/results/generate-pdf", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

export {
  apiClient as default,
  fetchResultsByDateRange,
  generatePDFReport
};
