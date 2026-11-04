// AdminSeniors.jsx — Senior verification: Pending / Approved tabs
// GET /api/admin/seniors?status=pending|approved
// PATCH /api/admin/seniors/:id/approve
// PATCH /api/admin/seniors/:id/reject  (also used as "Revoke" for approved seniors)

import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const TABS = ["pending", "approved"];

const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const AdminSeniors = () => {
  const [tab, setTab]           = useState("pending");
  const [seniors, setSeniors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null); // id currently being actioned
  const [toast, setToast]       = useState(null);  // { type: "success"|"error", msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSeniors = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/seniors?status=${status}`);
      setSeniors(res.data?.data || []);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to load seniors.");
      setSeniors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeniors(tab);
  }, [tab, fetchSeniors]);

  const handleAction = async (id, action) => {
    setActionId(id);
    try {
      const res = await api.patch(`/admin/seniors/${id}/${action}`);
      showToast("success", res.data?.message || "Done.");
      await fetchSeniors(tab);
    } catch (err) {
      showToast("error", err.response?.data?.message || `Failed to ${action} senior.`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Senior Verification</h2>
      <p className="admin-section-subtitle">Review and manage senior account requests.</p>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`admin-tab-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {loading ? (
        <Spinner message="Loading seniors..." />
      ) : seniors.length === 0 ? (
        <div className="admin-empty">
          No {tab} seniors found.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Placed At</th>
                <th>Placed Year</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seniors.map((s) => {
                const busy = actionId === s._id;
                return (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: "var(--muted)" }}>{s.email}</td>
                    <td>{s.branch || "—"}</td>
                    <td>{s.placedCompany || "—"}</td>
                    <td>{s.placedYear || "—"}</td>
                    <td>{fmt(s.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {tab === "pending" && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                              disabled={busy}
                              onClick={() => handleAction(s._id, "approve")}
                            >
                              {busy ? "…" : "Approve"}
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                              disabled={busy}
                              onClick={() => handleAction(s._id, "reject")}
                            >
                              {busy ? "…" : "Reject"}
                            </button>
                          </>
                        )}
                        {tab === "approved" && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                            disabled={busy}
                            onClick={() => handleAction(s._id, "reject")}
                          >
                            {busy ? "…" : "Revoke"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSeniors;

