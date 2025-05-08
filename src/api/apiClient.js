import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://172.20.10.4:5001/api";

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

export default apiClient;
