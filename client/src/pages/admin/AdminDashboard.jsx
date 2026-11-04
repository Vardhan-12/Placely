// AdminDashboard.jsx — Admin-only page at /admin
// Left sidebar with 4 sections; content swaps without full page reload.

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminOverview     from "./AdminOverview";
import AdminSeniors      from "./AdminSeniors";
import AdminCompanies    from "./AdminCompanies";
import AdminExperiences  from "./AdminExperiences";
import "../../styles/admin.css";

const SECTIONS = [
  { id: "overview",     label: "Overview",        icon: "📊" },
  { id: "seniors",      label: "Senior Verification", icon: "✅" },
  { id: "companies",    label: "Companies",        icon: "🏢" },
  { id: "experiences",  label: "Experiences",      icon: "📝" },
];

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [active, setActive] = useState("overview");

  // ── Access guard ──────────────────────────────────────────────────────────
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="admin-denied">
        <div className="admin-denied-box">
          <h2>Access Denied</h2>
          <p>This page is restricted to administrators.</p>
          <Link to="/" className="btn btn-outline" style={{ marginTop: 20 }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (active) {
      case "overview":    return <AdminOverview />;
      case "seniors":     return <AdminSeniors />;
      case "companies":   return <AdminCompanies />;
      case "experiences": return <AdminExperiences />;
      default:            return <AdminOverview />;
    }
  };

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-label">Admin Panel</div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`admin-sidebar-btn${active === s.id ? " active" : ""}`}
            onClick={() => setActive(s.id)}
          >
            <span className="admin-sidebar-icon">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </aside>

      {/* ── Main content ── */}
      <main className="admin-main">
        {renderSection()}
      </main>
    </div>
  );
};

export default AdminDashboard;

