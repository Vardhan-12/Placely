// ProtectedRoute.jsx - Route wrapper enforcing authentication and role permissions

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: "48px 16px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check if roles prop is supplied
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <div className="card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ marginBottom: 12, color: "var(--danger)" }}>Access Denied</h3>
          <p style={{ color: "var(--muted)", marginBottom: 18 }}>
            You do not have permission to access this page. This section requires: {roles.join(", ")}.
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            Your current role: <strong>{user.role}</strong>
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

