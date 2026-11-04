// PublicProfile.jsx - Public user profile page at /users/:id

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
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

const PublicProfile = () => {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/users/${id}/public`);
        if (isMounted) {
          setProfile(res.data?.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "User profile not found.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <Spinner message="Loading user profile..." />;

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <EmptyState
          title="User not found"
          message="We couldn't find the profile you are looking for."
          action={
            <Link to="/companies" className="btn btn-primary">
              Browse Companies
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="card profile-card">
        <div className="profile-header">
          <div>
            <h1 className="profile-name">{profile.name}</h1>
            <div className="profile-role-row">
              <span className={getRoleBadgeClass(profile.role)}>{profile.role}</span>
              {profile.role === "senior" && (
                <span className="badge badge-success">Senior Contributor</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="profile-field">
            <span className="profile-field-label">Branch / Department</span>
            <span className="profile-field-value">{profile.branch || "Not specified"}</span>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Account Role</span>
            <span className="profile-field-value" style={{ textTransform: "capitalize" }}>
              {profile.role}
            </span>
          </div>
        </div>

        {profile.role === "senior" && (
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <div className="profile-stat-count">{profile.experienceCount ?? 0}</div>
              <div className="profile-stat-label">Experiences Shared</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-count">{profile.answerCount ?? 0}</div>
              <div className="profile-stat-label">Answers Given</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <Link to="/companies" className="btn btn-outline">
            &larr; Back to Companies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

