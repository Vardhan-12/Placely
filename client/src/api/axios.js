// axios.js - Configured Axios instance with auth interceptor

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to outgoing requests if available in localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("placely_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Failed to read token from localStorage", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

