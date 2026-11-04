// AdminOverview.jsx — Stat cards from GET /api/admin/stats

import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const STATS = [
  { key: "users",          label: "Total Users",       alert: false },
  { key: "pendingSeniors", label: "Pending Seniors",   alert: true  },
  { key: "companies",      label: "Companies",         alert: false },
  { key: "experiences",    label: "Experiences",       alert: false },
  { key: "questions",      label: "Questions",         alert: false },
];

const AdminOverview = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/admin/stats");
        if (alive) setStats(res.data?.data);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || "Failed to load stats.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <Spinner message="Loading stats..." />;

  return (
    <div>
      <h2 className="admin-section-title">Overview</h2>
      <p className="admin-section-subtitle">Platform-wide counts at a glance.</p>

      {error && <div className="admin-toast admin-toast-error">{error}</div>}

      {stats && (
        <div className="admin-stats-grid">
          {STATS.map(({ key, label, alert }) => (
            <div
              key={key}
              className={`admin-stat-card${alert && stats[key] > 0 ? " admin-stat-alert" : ""}`}
            >
              <div className="admin-stat-label">{label}</div>
              <div className="admin-stat-value">{stats[key] ?? "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOverview;

