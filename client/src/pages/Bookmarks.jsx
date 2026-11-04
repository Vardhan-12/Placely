// Bookmarks.jsx - Saved interview experiences for authenticated users

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/qa.css";

const getResultBadgeClass = (result) => {
  switch (result) {
    case "selected":
      return "badge badge-success";
    case "rejected":
      return "badge badge-danger";
    case "waiting":
      return "badge badge-warning";
    default:
      return "badge badge-gray";
  }
};

const Bookmarks = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true, state: { from: { pathname: "/bookmarks" } } });
    }
  }, [isAuthenticated, navigate]);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/bookmarks");
      setBookmarks(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated, fetchBookmarks]);

  const handleRemove = async (expId) => {
    setRemovingId(expId);
    try {
      await api.post(`/bookmarks/${expId}`);
      // Refresh bookmarks list
      await fetchBookmarks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove bookmark.");
    } finally {
      setRemovingId(null);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) return <Spinner message="Loading saved experiences..." />;

  return (
    <div className="bookmarks-container">
      <div className="bookmarks-header">
        <h1 className="bookmarks-title">Saved Experiences</h1>
        <p className="bookmarks-subtitle">
          Quickly access interview experiences you've bookmarked.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>}

      {!error && bookmarks.length === 0 && (
        <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", marginBottom: 20 }}>
            You haven't bookmarked any interview experiences yet.
          </p>
          <Link to="/companies" className="btn btn-primary">
            Browse Companies
          </Link>
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="bookmarks-list">
          {bookmarks.map((exp) => {
            const companyName = exp.company?.name || "Company";
            const isRemoving = removingId === exp._id;

            return (
              <div key={exp._id} className="card bookmark-card">
                <div className="bookmark-card-body">
                  <div className="bookmark-info">
                    <div className="bookmark-company">{companyName}</div>
                    <div className="bookmark-role-year">
                      {exp.role} &middot; {exp.year}
                    </div>
                    {exp.result && (
                      <div style={{ marginTop: 4 }}>
                        <span className={getResultBadgeClass(exp.result)}>
                          {exp.result}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bookmark-actions">
                    <Link to={`/experiences/${exp._id}`} className="btn btn-outline">
                      View
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={isRemoving}
                      onClick={() => handleRemove(exp._id)}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;

