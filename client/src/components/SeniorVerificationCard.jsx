// SeniorVerificationCard.jsx - Reusable component showing verification status, rejection reason, and re-upload form

import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/notifications.css";

const SeniorVerificationCard = ({ onUploaded }) => {
  const { user, refreshUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (user?.role !== "senior") return null;

  const isApproved = user?.isVerified || user?.verificationStatus === "approved";
  if (isApproved) return null;

  const isRejected = user?.verificationStatus === "rejected";
  const isPending = !isApproved && !isRejected;

  const handleReupload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please choose a proof document to upload.");
      return;
    }

    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Invalid file type. Only PDF, JPG, and PNG are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5 MB limit.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("proof", file);

      const res = await api.post("/auth/resubmit-proof", formData);
      setSuccess(res.data?.message || "Proof resubmitted! Under review by admins.");
      setFile(null);
      if (refreshUser) {
        await refreshUser();
      }

      // Update session user in localStorage
      if (res.data?.user) {
        const storedUser = localStorage.getItem("placely_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const updated = { ...parsed, ...res.data.user };
          localStorage.setItem("placely_user", JSON.stringify(updated));
        }
      }

      if (onUploaded) onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload proof. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`proof-status-card ${isRejected ? "rejected" : "pending"}`}>
      <div className="proof-status-title">
        {isRejected ? (
          <>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span> Verification Rejected
          </>
        ) : (
          <>
            <span style={{ fontSize: "1.1rem" }}>⏳</span> Verification Under Review
          </>
        )}
      </div>

      {isPending && (
        <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--alert-warn-text)", lineHeight: 1.5 }}>
          Your senior placement proof is currently under review by college administrators. You will be able to share experiences and answer questions once approved.
        </p>
      )}

      {isRejected && (
        <>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--alert-danger-text)" }}>
            Admin feedback:
          </p>
          <div className="proof-reason-box">
            {user?.rejectionReason || "No specific feedback was provided. Please verify your document is clear."}
          </div>

          <form onSubmit={handleReupload} className="proof-upload-form">
            {error && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ color: "var(--success)", fontSize: "0.85rem", fontWeight: 600 }}>
                {success}
              </div>
            )}

            <label className="label" style={{ marginBottom: 0, fontSize: "0.85rem" }}>
              Upload New Proof Document (PDF, JPG, PNG - max 5 MB):
            </label>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              className="proof-file-input"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError("");
              }}
            />

            <div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
                style={{ padding: "6px 16px", fontSize: "0.85rem" }}
              >
                {uploading ? "Submitting proof…" : "Resubmit Proof"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default SeniorVerificationCard;

