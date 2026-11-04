// ExperienceDetail.jsx - Detailed view of a placement experience with upvoting, bookmarking, and admin actions

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import "../styles/experiences.css";

// Helper: Badge classes for result & difficulty
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

const getDifficultyBadgeClass = (diff) => {
  switch (diff) {
    case "easy":
      return "badge badge-success";
    case "medium":
      return "badge badge-warning";
    case "hard":
      return "badge badge-danger";
    default:
      return "badge badge-gray";
  }
};

const ExperienceDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upvote state
  const [upvotesCount, setUpvotesCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  // Deletion state
  const [deleting, setDeleting] = useState(false);

  // Fetch experience details
  useEffect(() => {
    let isMounted = true;
    const fetchExperience = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/experiences/${id}`);
        if (isMounted) {
          const exp = res.data?.data;
          setExperience(exp);
          setUpvotesCount(exp?.upvotes?.length || 0);

          // Check if current user has already upvoted
          if (user && exp?.upvotes) {
            const userId = user.id || user._id;
            const upvoted = exp.upvotes.some(
              (u) => (typeof u === "string" ? u : u?._id) === userId
            );
            setHasUpvoted(upvoted);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Experience not found");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExperience();
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  // Check if bookmarked on load if logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const checkBookmark = async () => {
      try {
        const res = await api.get("/bookmarks");
        if (isMounted) {
          const list = res.data?.data || [];
          const found = list.some((item) => (item._id || item) === id);
          setIsBookmarked(found);
        }
      } catch {
        // Silently catch bookmark check errors
      }
    };

    checkBookmark();
    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  // Handle Upvote Toggle
  const handleUpvote = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/experiences/${id}` } } });
      return;
    }

    if (upvoting) return;
    setUpvoting(true);

    // Optimistic UI update
    const previousCount = upvotesCount;
    const previousState = hasUpvoted;
    setUpvotesCount((prev) => (previousState ? prev - 1 : prev + 1));
    setHasUpvoted(!previousState);

    try {
      const res = await api.post(`/experiences/${id}/upvote`);
      if (res.data?.success && res.data?.upvoteCount !== undefined) {
        setUpvotesCount(res.data.upvoteCount);
      }
    } catch (err) {
      // Revert on error
      setUpvotesCount(previousCount);
      setHasUpvoted(previousState);
      alert(err.response?.data?.message || "Failed to update upvote");
    } finally {
      setUpvoting(false);
    }
  };

  // Handle Bookmark Toggle
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/experiences/${id}` } } });
      return;
    }

    if (bookmarking) return;
    setBookmarking(true);

    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      const res = await api.post(`/bookmarks/${id}`);
      if (res.data?.success && res.data?.isBookmarked !== undefined) {
        setIsBookmarked(res.data.isBookmarked);
      }
    } catch (err) {
      setIsBookmarked(previousState);
      alert(err.response?.data?.message || "Failed to toggle bookmark");
    } finally {
      setBookmarking(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this placement experience? This cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/experiences/${id}`);
      const compId = experience?.company?._id || experience?.company;
      if (compId) {
        navigate(`/companies/${compId}`);
      } else {
        navigate("/companies");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete experience");
      setDeleting(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading interview experience..." />;
  }

  if (error || !experience) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <EmptyState
          title="Experience not found"
          message="We couldn't find the interview experience you're looking for."
          action={
            <Link to="/companies" className="btn btn-primary">
              Browse Companies
            </Link>
          }
        />
      </div>
    );
  }

  const isAdmin = Boolean(isAuthenticated && user?.role === "admin");

  const companyId = experience.company?._id || experience.company;
  const companyName = experience.company?.name || "Company";

  return (
    <div className="exp-container">
      {/* Back link */}
      <div style={{ marginBottom: 16 }}>
        <Link
          to={`/companies/${companyId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.9rem",
            color: "var(--muted)",
          }}
        >
          ← Back to {companyName}
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="card exp-detail-header">
        <div className="exp-header-top">
          <div>
            <Link to={`/companies/${companyId}`} className="exp-company-link">
              {companyName}
            </Link>
            <h1 className="exp-title">
              {experience.role} ({experience.year})
            </h1>

            <div className="exp-badges-row">
              {experience.result && (
                <span className={getResultBadgeClass(experience.result)}>
                  {experience.result}
                </span>
              )}
              {experience.difficulty && (
                <span className={getDifficultyBadgeClass(experience.difficulty)}>
                  {experience.difficulty} difficulty
                </span>
              )}
              {experience.packageLPA && (
                <span className="badge badge-blue">
                  {experience.packageLPA} LPA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Author metadata */}
        <div className="exp-author-bar">
          <span>Shared by</span>
          <span className="exp-author-name">
            {experience.isAnonymous ? "Anonymous" : experience.author?.name || "Senior"}
          </span>
          {!experience.isAnonymous && (
            <span className="badge badge-cyan">Verified Senior</span>
          )}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="exp-actions-bar">
        <div className="exp-actions-left">
          {/* Upvote button */}
          <button
            type="button"
            className={`btn btn-outline ${hasUpvoted ? "btn-action-active" : ""}`}
            onClick={handleUpvote}
            disabled={upvoting}
          >
            ▲ {hasUpvoted ? "Upvoted" : "Upvote"} ({upvotesCount})
          </button>

          {/* Bookmark button */}
          <button
            type="button"
            className={`btn btn-outline ${isBookmarked ? "btn-action-active" : ""}`}
            onClick={handleBookmark}
            disabled={bookmarking}
          >
            ★ {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>

        {/* Admin Delete Action */}
        <div className="exp-actions-right">
          {isAdmin && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      {/* Rounds Breakdown Section */}
      <div className="card exp-section">
        <h2 className="exp-section-title">
          Interview Rounds ({experience.rounds?.length || 0})
        </h2>

        {experience.rounds && experience.rounds.length > 0 ? (
          <div className="exp-rounds-list">
            {experience.rounds.map((round, index) => (
              <div key={round._id || index} className="exp-round-card">
                <div className="exp-round-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--navy)",
                        fontSize: "1.05rem",
                      }}
                    >
                      Round {index + 1}
                    </span>
                    {round.type && (
                      <span className="badge badge-blue">{round.type}</span>
                    )}
                  </div>

                  <div className="exp-round-meta">
                    {round.difficulty && (
                      <span className={getDifficultyBadgeClass(round.difficulty)}>
                        {round.difficulty}
                      </span>
                    )}
                    {round.durationMinutes && (
                      <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                        ⏱ {round.durationMinutes} mins
                      </span>
                    )}
                  </div>
                </div>

                {/* Topics Covered */}
                {round.topics && round.topics.length > 0 && (
                  <div className="exp-topics-list">
                    {round.topics.map((topic, tIdx) => (
                      <span key={tIdx} className="badge badge-gray">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Round notes / questions */}
                {round.notes && (
                  <div className="exp-round-notes">
                    <p style={{ whiteSpace: "pre-line" }}>{round.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
            No specific round details listed.
          </p>
        )}
      </div>

      {/* Preparation Tips */}
      {experience.tips && (
        <div className="card exp-section">
          <h2 className="exp-section-title">Preparation Tips</h2>
          <div className="content-block content-block-tips">
            <p>{experience.tips}</p>
          </div>
        </div>
      )}

      {/* Mistakes to Avoid */}
      {experience.mistakes && (
        <div className="card exp-section">
          <h2 className="exp-section-title">Mistakes to Avoid</h2>
          <div className="content-block content-block-mistakes">
            <p>{experience.mistakes}</p>
          </div>
        </div>
      )}

      {/* Resources & Links */}
      {experience.resources && experience.resources.length > 0 && (
        <div className="card exp-section">
          <h2 className="exp-section-title">Recommended Resources</h2>
          <ul className="resources-list">
            {experience.resources.map((item, idx) => (
              <li key={idx} className="resource-item">
                <span>🔗</span>
                {item.startsWith("http://") || item.startsWith("https://") ? (
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 500 }}
                  >
                    {item}
                  </a>
                ) : (
                  <span>{item}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExperienceDetail;

