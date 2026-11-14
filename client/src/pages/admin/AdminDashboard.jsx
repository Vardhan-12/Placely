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
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    ),
  },
  {
    id: "seniors",
    label: "Senior Verification",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <polyline points="17 11 19 13 23 9"></polyline>
      </svg>
    ),
  },
  {
    id: "companies",
    label: "Companies",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="9" y1="22" x2="9" y2="22.01"></line>
        <line x1="15" y1="22" x2="15" y2="22.01"></line>
        <line x1="9" y1="18" x2="9" y2="18.01"></line>
        <line x1="15" y1="18" x2="15" y2="18.01"></line>
        <line x1="9" y1="14" x2="9" y2="14.01"></line>
        <line x1="15" y1="14" x2="15" y2="14.01"></line>
        <line x1="9" y1="10" x2="9" y2="10.01"></line>
        <line x1="15" y1="10" x2="15" y2="10.01"></line>
        <line x1="9" y1="6" x2="9" y2="6.01"></line>
        <line x1="15" y1="6" x2="15" y2="6.01"></line>
      </svg>
    ),
  },
  {
    id: "experiences",
    label: "Experiences",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
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

