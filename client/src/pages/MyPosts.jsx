// MyPosts.jsx - Senior's own posted experiences with View, Edit, Delete actions

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/experiences.css";

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

const MyPosts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Guard: only seniors may access this page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (user?.role !== "senior") {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const fetchMyPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/experiences/mine");
      setPosts(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "senior") {
      fetchMyPosts();
    }
  }, [isAuthenticated, user, fetchMyPosts]);

  const handleDelete = async (postId, companyName) => {
    const confirmed = window.confirm(
      `Delete this experience at ${companyName || "this company"}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(postId);
    try {
      await api.delete(`/experiences/${postId}`);
      // Refresh list after deletion
      await fetchMyPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete experience.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated || user?.role !== "senior") return null;

  if (loading) return <Spinner message="Loading your posts..." />;

  return (
    <div className="exp-container">
      {/* Page Header */}
      <div className="my-posts-header">
        <div>
          <h1 className="my-posts-title">My Posts</h1>
          <p className="my-posts-subtitle">
            Manage the placement experiences you have shared.
          </p>
        </div>
        <Link to="/experiences/new" className="btn btn-primary">
          + Write Experience
        </Link>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Empty State */}
      {!error && posts.length === 0 && (
        <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", marginBottom: 20 }}>
            You haven't shared any placement experiences yet.
          </p>
          <Link to="/experiences/new" className="btn btn-primary">
            Write Experience
          </Link>
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 && (
        <div className="my-posts-list">
          {posts.map((post) => {
            const companyName = post.company?.name || "Unknown Company";
            const companyId = post.company?._id || post.company;
            const isDeleting = deletingId === post._id;

            return (
              <div key={post._id} className="card my-post-card">
                <div className="my-post-card-body">
                  {/* Left: metadata */}
                  <div className="my-post-info">
                    <div className="my-post-company">{companyName}</div>
                    <div className="my-post-role-year">
                      {post.role} &middot; {post.year}
                    </div>
                    <div className="my-post-badges">
                      {post.result && (
                        <span className={getResultBadgeClass(post.result)}>
                          {post.result}
                        </span>
                      )}
                      {post.isAnonymous && (
                        <span className="badge badge-gray">Anonymous</span>
                      )}
                    </div>
                    <div className="my-post-upvotes">
                      ▲ {post.upvotes?.length || 0} upvote
                      {post.upvotes?.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="my-post-actions">
                    <Link
                      to={`/experiences/${post._id}`}
                      className="btn btn-outline"
                    >
                      View
                    </Link>
                    <Link
                      to={`/experiences/${post._id}/edit`}
                      className="btn btn-outline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={isDeleting}
                      onClick={() => handleDelete(post._id, companyName)}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
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

export default MyPosts;

