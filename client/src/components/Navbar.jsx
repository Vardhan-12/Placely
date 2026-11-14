// Navbar.jsx - Top navigation header with role-based links and responsive mobile menu

import React, { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import api from "../api/axios";
import useAutoRefresh from "../hooks/useAutoRefresh";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminPendingCount, setAdminPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
    setIsMobileMenuOpen(false);
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
        position: "sticky",
        top: 0,
        zIndex: 50,
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
        {/* Brand Logo & Desktop Nav Links */}
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
              textDecoration: "none",
            }}
          >
            Placely<span style={{ color: "var(--accent)" }}>.</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-desktop-links">
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? "var(--accent)" : "var(--navbar-link)",
                fontSize: "0.95rem",
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                padding: "6px 0",
                textDecoration: "none",
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/companies"
              style={({ isActive }) => ({
                color: isActive ? "var(--accent)" : "var(--navbar-link)",
                fontSize: "0.95rem",
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                padding: "6px 0",
                textDecoration: "none",
              })}
            >
              Companies
            </NavLink>

            {/* Junior-specific navigation */}
            {isAuthenticated && user?.role === "junior" && (
              <NavLink
                to="/bookmarks"
                style={({ isActive }) => ({
                  color: isActive ? "var(--accent)" : "var(--navbar-link)",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 600 : 500,
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  padding: "6px 0",
                  textDecoration: "none",
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
                    color: isActive ? "var(--accent)" : "var(--navbar-link)",
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 500,
                    borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    padding: "6px 0",
                    textDecoration: "none",
                  })}
                >
                  Write Experience
                </NavLink>
                <NavLink
                  to="/my-posts"
                  style={({ isActive }) => ({
                    color: isActive ? "var(--accent)" : "var(--navbar-link)",
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 500,
                    borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    padding: "6px 0",
                    textDecoration: "none",
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
                  color: isActive ? "var(--accent)" : "var(--navbar-link)",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? 600 : 500,
                  display: "flex",
                  alignItems: "center",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  padding: "6px 0",
                  textDecoration: "none",
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

        {/* Right side: Controls & Mobile Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Desktop Auth Actions */}
          <div className="nav-desktop-actions">
            {isAuthenticated ? (
              <>
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

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="nav-mobile-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="nav-mobile-drawer">
          <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/companies" onClick={() => setIsMobileMenuOpen(false)}>
            Companies
          </NavLink>
          {isAuthenticated && user?.role === "junior" && (
            <NavLink to="/bookmarks" onClick={() => setIsMobileMenuOpen(false)}>
              Saved
            </NavLink>
          )}
          {isAuthenticated && user?.role === "senior" && (
            <>
              <NavLink to="/experiences/new" onClick={() => setIsMobileMenuOpen(false)}>
                Write Experience
              </NavLink>
              <NavLink to="/my-posts" onClick={() => setIsMobileMenuOpen(false)}>
                My Posts
              </NavLink>
            </>
          )}
          {isAuthenticated && user?.role === "admin" && (
            <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
              Dashboard {adminPendingCount > 0 ? `(${adminPendingCount})` : ""}
            </NavLink>
          )}

          <div className="nav-mobile-actions">
            {isAuthenticated ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ color: "var(--navbar-text)", fontWeight: 600, border: "none" }}
                  >
                    {user.name} ({user.role})
                  </Link>
                  <NotificationBell />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline-white"
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <Link
                  to="/login"
                  className="btn btn-outline-white"
                  style={{ flex: 1, justifyContent: "center", padding: "10px" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", padding: "10px" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
