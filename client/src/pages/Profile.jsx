// Profile.jsx - Logged-in user's profile view (protected, read-only)

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/profile.css";

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

const Profile = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [seniorStats, setSeniorStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true, state: { from: { pathname: "/profile" } } });
      return;
    }

    // If senior, load public counts
    const userId = authUser?.id || authUser?._id;
    if (authUser?.role === "senior" && userId) {
      setLoading(true);
      api
        .get(`/users/${userId}/public`)
        .then((res) => {
          if (res.data?.data) {
            setSeniorStats(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load user stats", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated, authUser, navigate]);

  if (!isAuthenticated || !authUser) return null;

  return (
    <div className="profile-container">
      <div className="card profile-card">
        <div className="profile-header">
          <div>
            <h1 className="profile-name">{authUser.name}</h1>
            <div className="profile-role-row">
              <span className={getRoleBadgeClass(authUser.role)}>{authUser.role}</span>
              {authUser.role === "senior" && (
                <span className={`badge ${authUser.isVerified ? "badge-success" : "badge-warning"}`}>
                  {authUser.isVerified ? "Verified Senior" : "Pending Verification"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="profile-field">
            <span className="profile-field-label">Email Address</span>
            <span className="profile-field-value">{authUser.email}</span>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Branch / Department</span>
            <span className="profile-field-value">{authUser.branch || "Not specified"}</span>
          </div>

          {authUser.role === "senior" && (
            <>
              <div className="profile-field">
                <span className="profile-field-label">Placed Company</span>
                <span className="profile-field-value">{authUser.placedCompany || "Not specified"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-field-label">Placed Year</span>
                <span className="profile-field-value">{authUser.placedYear || "Not specified"}</span>
              </div>
            </>
          )}
        </div>

        {loading ? (
          <Spinner message="Loading statistics..." />
        ) : authUser.role === "senior" && seniorStats ? (
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <div className="profile-stat-count">{seniorStats.experienceCount ?? 0}</div>
              <div className="profile-stat-label">Experiences Shared</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-count">{seniorStats.answerCount ?? 0}</div>
              <div className="profile-stat-label">Answers Given</div>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          {authUser.role === "senior" && (
            <Link to="/my-posts" className="btn btn-outline">
              My Posts
            </Link>
          )}
          {authUser.role === "junior" && (
            <Link to="/bookmarks" className="btn btn-outline">
              Saved Experiences
            </Link>
          )}
          <Link to="/companies" className="btn btn-primary">
            Browse Companies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;

