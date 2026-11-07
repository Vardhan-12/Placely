// AuthContext.jsx - Authentication state, login, signup, token persistence, and live user refresh

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  const saveSession = useCallback((authToken, authUser) => {
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
  }, []);

  const logout = useCallback(() => {
    saveSession(null, null);
  }, [saveSession]);

  // refreshUser: calls /auth/me, updates state & localStorage (try/catch), logs out ONLY on 401
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("placely_token");
    if (!currentToken) return null;

    try {
      const res = await api.get("/auth/me");
      if (res.data?.success && res.data?.user) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        try {
          localStorage.setItem("placely_user", JSON.stringify(updatedUser));
        } catch (e) {
          console.error("Failed to update user in localStorage", e);
        }
        return updatedUser;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      } else {
        console.warn("Could not refresh user status:", err.message);
      }
    }
    return null;
  }, [logout]);

  // Initial load check if token exists
  useEffect(() => {
    const storedToken = localStorage.getItem("placely_token");
    if (storedToken) {
      refreshUser();
    }
  }, [refreshUser]);

  // Window focus & visibility listener
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.hidden) return;
      const storedToken = localStorage.getItem("placely_token");
      if (storedToken) {
        refreshUser();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [refreshUser]);

  // Poll every 30 seconds while user is a senior whose status is not approved
  useEffect(() => {
    if (!user || user.role !== "senior") return;
    const isApproved = user.isVerified || user.verificationStatus === "approved";
    if (isApproved) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshUser();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.role, user?.isVerified, user?.verificationStatus, refreshUser]);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        refreshUser,
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


