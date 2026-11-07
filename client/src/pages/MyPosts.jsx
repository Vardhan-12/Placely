// MyPosts.jsx - Senior's dashboard with My Experiences and Questions for Me tabs

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import SeniorVerificationCard from "../components/SeniorVerificationCard";
import useAutoRefresh from "../hooks/useAutoRefresh";
import "../styles/experiences.css";
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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const MyPosts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Top tabs: "experiences" | "questions"
  const [activeTab, setActiveTab] = useState("experiences");

  // Experiences tab state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postError, setPostError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Questions for Me tab state
  const [qSubTab, setQSubTab] = useState("unanswered"); // "unanswered" | "answered"
  const [matchedCompany, setMatchedCompany] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Question expansion and answering state
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedLoading, setExpandedLoading] = useState({});
  const [answerInputs, setAnswerInputs] = useState({});
  const [answering, setAnswering] = useState({});
  const [answerErrors, setAnswerErrors] = useState({});

  const isVerifiedSenior = user?.role === "senior" && Boolean(user?.isVerified);

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

  // Fetch experiences
  const fetchMyPosts = useCallback(async ({ isBackground = false } = {}) => {
    if (!isBackground) {
      setLoadingPosts(true);
    }
    setPostError("");
    try {
      const res = await api.get("/experiences/mine");
      setPosts(res.data?.data || []);
    } catch (err) {
      if (!isBackground) {
        setPostError(err.response?.data?.message || "Failed to load your posts.");
      }
    } finally {
      if (!isBackground) {
        setLoadingPosts(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "senior") {
      fetchMyPosts({ isBackground: false });
    }
  }, [isAuthenticated, user, fetchMyPosts]);

  // Fetch company & questions for "Questions for Me"
  const fetchQuestionsForMe = useCallback(async ({ isBackground = false } = {}) => {
    if (!user?.placedCompany) {
      setMatchedCompany(null);
      setQuestions([]);
      return;
    }

    if (!isBackground) {
      setLoadingQuestions(true);
    }
    setQuestionError("");
    try {
      const compRes = await api.get("/companies");
      const allCompanies = compRes.data?.data || [];
      const userPlaced = user.placedCompany.trim().toLowerCase();
      const targetCompany = allCompanies.find(
        (c) => c.name?.trim().toLowerCase() === userPlaced
      );

      if (!targetCompany) {
        setMatchedCompany(null);
        setQuestions([]);
        if (!isBackground) setLoadingQuestions(false);
        return;
      }

      setMatchedCompany(targetCompany);
      const qRes = await api.get(`/qa/questions?company=${targetCompany._id}`);
      setQuestions(qRes.data?.data || []);
    } catch (err) {
      if (!isBackground) {
        setQuestionError(err.response?.data?.message || "Failed to load questions.");
      }
    } finally {
      if (!isBackground) {
        setLoadingQuestions(false);
      }
    }
  }, [user?.placedCompany]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "senior" && activeTab === "questions") {
      fetchQuestionsForMe({ isBackground: false });
    }
  }, [isAuthenticated, user, activeTab, fetchQuestionsForMe]);

  // Auto refresh experiences tab (focus + 30s)
  useAutoRefresh(fetchMyPosts, {
    intervalMs: 30000,
    enabled: isAuthenticated && user?.role === "senior" && activeTab === "experiences",
  });

  // Auto refresh questions tab (focus + 30s)
  useAutoRefresh(fetchQuestionsForMe, {
    intervalMs: 30000,
    enabled: isAuthenticated && user?.role === "senior" && activeTab === "questions",
  });

  // Delete experience
  const handleDeleteExperience = async (postId, companyName) => {
    const confirmed = window.confirm(
      `Delete this experience at ${companyName || "this company"}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(postId);
    try {
      await api.delete(`/experiences/${postId}`);
      await fetchMyPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete experience.");
    } finally {
      setDeletingId(null);
    }
  };

  // Expand / collapse single question inline
  const fetchQuestionDetail = async (qId) => {
    setExpandedLoading((prev) => ({ ...prev, [qId]: true }));
    try {
      const res = await api.get(`/qa/questions/${qId}`);
      setExpandedDetails((prev) => ({ ...prev, [qId]: res.data?.data }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load question details.");
    } finally {
      setExpandedLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const handleToggleExpand = (qId) => {
    if (expandedDetails[qId]) {
      setExpandedDetails((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    } else {
      fetchQuestionDetail(qId);
    }
  };

  // Submit answer to question
  const handleAnswerSubmit = async (qId, e) => {
    e.preventDefault();
    setAnswerErrors((prev) => ({ ...prev, [qId]: "" }));
    const text = (answerInputs[qId] || "").trim();
    if (!text) {
      setAnswerErrors((prev) => ({ ...prev, [qId]: "Answer text is required." }));
      return;
    }
    if (text.length > 1000) {
      setAnswerErrors((prev) => ({
        ...prev,
        [qId]: "Answer must be 1000 characters or less.",
      }));
      return;
    }

    setAnswering((prev) => ({ ...prev, [qId]: true }));
    try {
      await api.post(`/qa/questions/${qId}/answers`, { text });
      setAnswerInputs((prev) => ({ ...prev, [qId]: "" }));
      // Refresh question detail and questions list so it re-categorizes to Answered
      await fetchQuestionDetail(qId);
      if (matchedCompany?._id) {
        const qRes = await api.get(`/qa/questions?company=${matchedCompany._id}`);
        setQuestions(qRes.data?.data || []);
      }
    } catch (err) {
      setAnswerErrors((prev) => ({
        ...prev,
        [qId]: err.response?.data?.message || "Failed to submit answer.",
      }));
    } finally {
      setAnswering((prev) => ({ ...prev, [qId]: false }));
    }
  };

  if (!isAuthenticated || user?.role !== "senior") return null;

  // Filtered lists for unanswered and answered questions
  const unansweredQuestions = questions.filter((q) => (q.answerCount || 0) === 0);
  const answeredQuestions = questions.filter((q) => (q.answerCount || 0) > 0);
  const displayedQuestions =
    qSubTab === "unanswered" ? unansweredQuestions : answeredQuestions;

  return (
    <div className="exp-container">
      {/* Senior Verification / Rejection / Re-upload Notice */}
      <SeniorVerificationCard />

      {/* Page Header */}
      <div className="my-posts-header">
        <div>
          <h1 className="my-posts-title">My Posts</h1>
          <p className="my-posts-subtitle">
            Manage your placement experiences and answer questions about{" "}
            {user?.placedCompany || "your company"}.
          </p>
        </div>
        {activeTab === "experiences" && (
          <Link to="/experiences/new" className="btn btn-primary">
            + Write Experience
          </Link>
        )}
      </div>

      {/* Top Tabs */}
      <div className="myposts-tabs">
        <button
          type="button"
          className={`myposts-tab-btn ${activeTab === "experiences" ? "active" : ""}`}
          onClick={() => setActiveTab("experiences")}
        >
          My Experiences
        </button>
        <button
          type="button"
          className={`myposts-tab-btn ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          Questions for Me
        </button>
      </div>

      {/* ── TAB 1: My Experiences ── */}
      {activeTab === "experiences" && (
        <div>
          {postError && (
            <div className="form-error" style={{ marginBottom: 20 }}>
              {postError}
            </div>
          )}

          {loadingPosts ? (
            <Spinner message="Loading your experiences..." />
          ) : !postError && posts.length === 0 ? (
            <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "var(--muted)",
                  marginBottom: 20,
                }}
              >
                You haven't shared any placement experiences yet.
              </p>
              <Link to="/experiences/new" className="btn btn-primary">
                Write Experience
              </Link>
            </div>
          ) : (
            <div className="my-posts-list">
              {posts.map((post) => {
                const companyName = post.company?.name || "Unknown Company";
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
                          onClick={() =>
                            handleDeleteExperience(post._id, companyName)
                          }
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
      )}

      {/* ── TAB 2: Questions for Me ── */}
      {activeTab === "questions" && (
        <div>
          {questionError && (
            <div className="form-error" style={{ marginBottom: 20 }}>
              {questionError}
            </div>
          )}

          {loadingQuestions ? (
            <Spinner message="Loading questions for your company..." />
          ) : !matchedCompany ? (
            <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
              <p
                style={{
                  fontSize: "1.05rem",
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                No questions yet for your company.
              </p>
            </div>
          ) : (
            <div>
              {/* Sub-tabs: Unanswered vs Answered */}
              <div className="myposts-subtabs">
                <button
                  type="button"
                  className={`myposts-subtab-btn ${
                    qSubTab === "unanswered" ? "active" : ""
                  }`}
                  onClick={() => setQSubTab("unanswered")}
                >
                  Unanswered ({unansweredQuestions.length})
                </button>
                <button
                  type="button"
                  className={`myposts-subtab-btn ${
                    qSubTab === "answered" ? "active" : ""
                  }`}
                  onClick={() => setQSubTab("answered")}
                >
                  Answered ({answeredQuestions.length})
                </button>
              </div>

              {/* Sub-list empty state */}
              {displayedQuestions.length === 0 ? (
                <div
                  className="card"
                  style={{ padding: "40px 24px", textAlign: "center" }}
                >
                  <p style={{ color: "var(--muted)", margin: 0 }}>
                    {qSubTab === "unanswered"
                      ? "No unanswered questions for " + matchedCompany.name + "."
                      : "No answered questions yet for " + matchedCompany.name + "."}
                  </p>
                </div>
              ) : (
                <div className="qa-list">
                  {displayedQuestions.map((q) => {
                    const isExpanded = Boolean(expandedDetails[q._id]);
                    const isLoadingDetail = Boolean(expandedLoading[q._id]);
                    const detail = expandedDetails[q._id];

                    return (
                      <div key={q._id} className="card qa-question-card">
                        <div
                          className="qa-question-header"
                          onClick={() => handleToggleExpand(q._id)}
                        >
                          <div className="qa-question-main">
                            <div className="qa-question-text">{q.text}</div>
                            <div className="qa-question-meta">
                              <span>Asked by {q.askedBy?.name || "Student"}</span>
                              <span>&bull;</span>
                              <span>{formatDate(q.createdAt)}</span>
                              <span>&bull;</span>
                              <span style={{ fontWeight: 600, color: "var(--blue)" }}>
                                💬 {q.answerCount || 0} answer
                                {q.answerCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <span className="qa-expand-indicator">
                            {isExpanded ? "▲ Collapse" : "▼ Answers"}
                          </span>
                        </div>

                        {/* Inline expanded answers & answer form */}
                        {isExpanded && (
                          <div className="qa-answers-expanded">
                            {isLoadingDetail ? (
                              <Spinner message="Loading answers..." />
                            ) : (
                              <>
                                {detail?.answers?.length === 0 ? (
                                  <p
                                    style={{
                                      color: "var(--muted)",
                                      fontStyle: "italic",
                                      margin: "8px 0",
                                    }}
                                  >
                                    No answers yet for this question.
                                  </p>
                                ) : (
                                  detail?.answers?.map((ans) => (
                                    <div
                                      key={ans._id}
                                      className={`qa-answer-card ${
                                        ans.isBest ? "is-best" : ""
                                      }`}
                                    >
                                      <div className="qa-answer-header">
                                        <div className="qa-answer-author">
                                          <span>
                                            {ans.answeredBy?.name || "Senior"}
                                          </span>
                                          <span className="badge badge-cyan">
                                            {ans.answeredBy?.role || "senior"}
                                          </span>
                                          {ans.isBest && (
                                            <span className="badge badge-success">
                                              ✓ Best Answer
                                            </span>
                                          )}
                                          <span
                                            style={{
                                              fontSize: "0.8rem",
                                              color: "var(--muted)",
                                              fontWeight: 400,
                                            }}
                                          >
                                            {formatDate(ans.createdAt)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="qa-answer-text">{ans.text}</div>
                                    </div>
                                  ))
                                )}

                                {/* Answer Form / Verification Notice */}
                                {isVerifiedSenior ? (
                                  <div className="qa-answer-form-wrapper">
                                    <div className="qa-answer-form-title">
                                      Your Answer
                                    </div>
                                    {answerErrors[q._id] && (
                                      <div
                                        className="form-error"
                                        style={{ marginBottom: 10 }}
                                      >
                                        {answerErrors[q._id]}
                                      </div>
                                    )}
                                    <form
                                      onSubmit={(e) =>
                                        handleAnswerSubmit(q._id, e)
                                      }
                                    >
                                      <textarea
                                        className="input"
                                        rows={3}
                                        placeholder="Write your answer (max 1000 characters)..."
                                        value={answerInputs[q._id] || ""}
                                        maxLength={1000}
                                        onChange={(e) =>
                                          setAnswerInputs((prev) => ({
                                            ...prev,
                                            [q._id]: e.target.value,
                                          }))
                                        }
                                        required
                                      />
                                      <div className="qa-char-count">
                                        {(answerInputs[q._id] || "").length} / 1000
                                      </div>
                                      <div style={{ marginTop: 8 }}>
                                        <button
                                          type="submit"
                                          className="btn btn-primary"
                                          style={{
                                            padding: "6px 16px",
                                            fontSize: "0.85rem",
                                          }}
                                          disabled={
                                            answering[q._id] ||
                                            !(answerInputs[q._id] || "").trim()
                                          }
                                        >
                                          {answering[q._id]
                                            ? "Submitting..."
                                            : "Submit Answer"}
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                ) : (
                                  <div className="qa-senior-pending-notice">
                                    Pending verification
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyPosts;
