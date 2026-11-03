// AuthContext.jsx - Authentication state, login, signup, and token persistence

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial render
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("placely_token");
      const storedUser = localStorage.getItem("placely_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Failed to restore session from localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save or remove session from state & localStorage
  const saveSession = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    try {
      if (authToken && authUser) {
        localStorage.setItem("placely_token", authToken);
        localStorage.setItem("placely_user", JSON.stringify(authUser));
      } else {
        localStorage.removeItem("placely_token");
        localStorage.removeItem("placely_user");
      }
    } catch (err) {
      console.error("Failed to update localStorage", err);
    }
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.success) {
      saveSession(res.data.token, res.data.user);
      return res.data;
    }
    throw new Error(res.data?.message || "Login failed");
  };

  const signup = async (data) => {
    const res = await api.post("/auth/signup", data);
    if (res.data?.success) {
      saveSession(res.data.token, res.data.user);
      return res.data;
    }
    throw new Error(res.data?.message || "Signup failed");
  };

  const logout = () => {
    saveSession(null, null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

