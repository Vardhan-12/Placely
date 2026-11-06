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

    // If payload is FormData, remove default "Content-Type" so browser sets multipart boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

