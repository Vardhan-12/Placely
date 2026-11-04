// Navbar.jsx - Top navigation header with role-based links and auth actions

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

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
        backgroundColor: "var(--navy)",
        color: "#ffffff",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
            }}
          >
            Placely<span style={{ color: "var(--cyan)" }}>.</span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link
              to="/"
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              Home
            </Link>
            <Link
              to="/companies"
              style={{
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "0.95rem",
                fontWeight: 500,
              }}
            >
              Companies
            </Link>

            {/* Junior-specific navigation */}
            {isAuthenticated && user?.role === "junior" && (
              <Link
                to="/bookmarks"
                style={{
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                Saved
              </Link>
            )}

            {/* Senior-specific navigation */}
            {isAuthenticated && user?.role === "senior" && (
              <>
                <Link
                  to="/experiences/new"
                  style={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                >
                  Write Experience
                </Link>
                <Link
                  to="/my-posts"
                  style={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                >
                  My Posts
                </Link>
              </>
            )}

            {/* Admin-specific navigation */}
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                style={{
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Auth Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {isAuthenticated ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  to="/profile"
                  style={{
                    fontSize: "0.9rem",
                    color: "#ffffff",
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

