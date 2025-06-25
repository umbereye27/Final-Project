// API Configuration
export const API_BASE_URL = "http://192.168.1.10:5000/api"; // Replace with your actual API URL
// ----------------------------- modal --------------------------
export const MODAL_API_URL = "http://172.20.10.4:4000";

// Other constants
export const APP_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_USERNAME_LENGTH: 3,
  DEFAULT_ROLE: "user",
  ROLES: [
    { label: "User", value: "user" },
    // { label: "Admin", value: "admin" },
    // { label: "Doctor", value: "doctor" }
  ]
};

// API Endpoints
export const API_ENDPOINTS = {
  SIGNUP: "/auth/signup",
  SIGNIN: "/auth/signin",
  LOGOUT: "/auth/logout",
};

