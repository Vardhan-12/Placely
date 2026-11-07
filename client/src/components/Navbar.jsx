// Navbar.jsx - Top navigation header with role-based links and auth actions

import React, { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import api from "../api/axios";
import useAutoRefresh from "../hooks/useAutoRefresh";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [adminPendingCount, setAdminPendingCount] = useState(0);

  // For admins, poll pending senior requests count
  const fetchAdminStats = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "admin") return;
    try {
      const res = await api.get("/admin/stats");
      if (res.data?.success && res.data?.data) {
        setAdminPendingCount(res.data.data.pendingSeniors || 0);
      }
    } catch (err) {
      // ignore background stat error
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchAdminStats();
    }
  }, [isAuthenticated, user?.role, fetchAdminStats]);

  useAutoRefresh(fetchAdminStats, {
    intervalMs: 30000,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "senior":
        return "badge badge-cyan";
      case "admin":
        return "badge badge-warning";
      default:
        return "badge badge-gray";
    }
  };

  return (
    <header
      style={{
        backgroundColor: "var(--navbar-bg)",
        color: "var(--navbar-text)",
        borderBottom: "1px solid var(--navbar-border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link
            to="/"
            className="logo"
            style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "var(--navbar-text)",
              display: "flex",
              alignItems: "center",
            }}
          >
            Placely<span style={{ color: "var(--cyan)" }}>.</span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? "var(--cyan)" : "var(--navbar-link)",
                fontSize: "0.95rem",
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                padding: "6px 0",
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/companies"
              style={({ isActive }) => ({
                color: isActive ? "var(--cyan)" : "var(--navbar-link)",
                fontSize: "0.95rem",
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                padding: "6px 0",
              })}
            >
              Companies
            </NavLink>

            {/* Junior-specific navigation */}
            {isAuthenticated && user?.role === "junior" && (
              <NavLink
                to="/bookmarks"
                style={({ isActive }) => ({
                  color: isActive ? "var(--cyan)" : "var(--navbar-link)",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 600 : 500,
                  borderBottom: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                  padding: "6px 0",
                })}
              >
                Saved
              </NavLink>
            )}

            {/* Senior-specific navigation */}
            {isAuthenticated && user?.role === "senior" && (
              <>
                <NavLink
                  to="/experiences/new"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--cyan)" : "var(--navbar-link)",
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 500,
                    borderBottom: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                    padding: "6px 0",
                  })}
                >
                  Write Experience
                </NavLink>
                <NavLink
                  to="/my-posts"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--cyan)" : "var(--navbar-link)",
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 500,
                    borderBottom: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                    padding: "6px 0",
                  })}
                >
                  My Posts
                </NavLink>
              </>
            )}

            {/* Admin-specific navigation */}
            {isAuthenticated && user?.role === "admin" && (
              <NavLink
                to="/admin"
                style={({ isActive }) => ({
                  color: isActive ? "var(--cyan)" : "var(--navbar-link)",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 600 : 500,
                  display: "flex",
                  alignItems: "center",
                  borderBottom: isActive ? "2px solid var(--cyan)" : "2px solid transparent",
                  padding: "6px 0",
                })}
              >
                Dashboard
                {adminPendingCount > 0 && (
                  <span className="nav-pending-badge" title={`${adminPendingCount} pending verification request(s)`}>
                    {adminPendingCount}
                  </span>
                )}
              </NavLink>
            )}
          </nav>
        </div>

        {/* Auth Actions & Theme Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  to="/profile"
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--navbar-text)",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                  title="View your profile"
                >
                  {user.name}
                </Link>
                <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline-white"
                style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-outline-white"
                style={{ padding: "8px 16px", fontSize: "0.9rem" }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.9rem" }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

