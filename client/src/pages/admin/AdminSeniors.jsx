// AdminSeniors.jsx — Senior verification: Pending / Approved / Rejected tabs
// GET /api/admin/seniors?status=pending|approved|rejected
// GET /api/admin/seniors/:id/proof (streams proof document)
// PATCH /api/admin/seniors/:id/approve
// PATCH /api/admin/seniors/:id/reject  (requires reason)

import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

const TABS = ["pending", "approved", "rejected"];

const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const AdminSeniors = () => {
  const [tab, setTab]           = useState("pending");
  const [seniors, setSeniors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null); // id currently being actioned
  const [toast, setToast]       = useState(null);  // { type: "success"|"error", msg }

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget]       = useState(null); // senior object
  const [rejectReason, setRejectReason]       = useState("");
  const [rejectError, setRejectError]         = useState("");
  const [viewingProofId, setViewingProofId]   = useState(null);

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

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      const res = await api.patch(`/admin/seniors/${id}/approve`);
      showToast("success", res.data?.message || "Senior approved successfully.");
      await fetchSeniors(tab);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to approve senior.");
    } finally {
      setActionId(null);
    }
  };

  const openRejectModal = (senior) => {
    setRejectTarget(senior);
    setRejectReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("A rejection reason is required.");
      return;
    }
    if (!rejectTarget) return;

    setActionId(rejectTarget._id);
    try {
      const res = await api.patch(`/admin/seniors/${rejectTarget._id}/reject`, {
        reason: rejectReason.trim(),
      });
      showToast("success", res.data?.message || "Senior verification rejected.");
      setRejectModalOpen(false);
      setRejectTarget(null);
      await fetchSeniors(tab);
    } catch (err) {
      setRejectError(err.response?.data?.message || "Failed to reject senior.");
    } finally {
      setActionId(null);
    }
  };

  const handleViewProof = async (id) => {
    setViewingProofId(id);
    try {
      const res = await api.get(`/admin/seniors/${id}/proof`, {
        responseType: "blob",
      });
      const contentType = res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Could not view proof document.");
    } finally {
      setViewingProofId(null);
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
                <th>Senior & Company</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Proof</th>
                {tab === "rejected" && <th>Reason</th>}
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seniors.map((s) => {
                const busy = actionId === s._id;
                const viewingProof = viewingProofId === s._id;
                return (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--navy)" }}>{s.name}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--blue)", fontWeight: 500 }}>
                        {s.placedCompany ? `${s.placedCompany} (${s.placedYear || "—"})` : "—"}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{s.email}</td>
                    <td>{s.branch || "—"}</td>
                    <td>
                      {s.hasProof ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: "3px 10px", fontSize: "0.75rem" }}
                          disabled={viewingProof}
                          onClick={() => handleViewProof(s._id)}
                        >
                          {viewingProof ? "Opening…" : "View Proof"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>No proof</span>
                      )}
                    </td>
                    {tab === "rejected" && (
                      <td style={{ fontSize: "0.82rem", color: "var(--danger)", maxWidth: 220 }}>
                        {s.rejectionReason || "No reason recorded"}
                      </td>
                    )}
                    <td style={{ fontSize: "0.82rem" }}>{fmt(s.createdAt)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {tab === "pending" && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                              disabled={busy}
                              onClick={() => handleApprove(s._id)}
                            >
                              {busy ? "…" : "Approve"}
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                              disabled={busy}
                              onClick={() => openRejectModal(s)}
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
                            onClick={() => openRejectModal(s)}
                          >
                            {busy ? "…" : "Revoke"}
                          </button>
                        )}
                        {tab === "rejected" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                            disabled={busy}
                            onClick={() => handleApprove(s._id)}
                          >
                            {busy ? "…" : "Re-approve"}
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

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 440 }}>
            <h3 className="admin-modal-title">
              {tab === "approved" ? "Revoke Senior Verification" : "Reject Senior Verification"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: "0 0 16px 0" }}>
              Please provide a clear reason for rejecting <strong>{rejectTarget?.name}</strong>. This message will be sent to the senior.
            </p>

            {rejectError && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: 12 }}>
                {rejectError}
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="rejectReason">
                Rejection Reason *
              </label>
              <textarea
                id="rejectReason"
                className="input"
                rows={3}
                placeholder="e.g. Uploaded document does not clearly show company name, or offer letter is unreadable."
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError("");
                }}
              />
            </div>

            <div className="admin-modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={actionId !== null}
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectTarget(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={actionId !== null}
                onClick={handleConfirmReject}
              >
                {actionId ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSeniors;

