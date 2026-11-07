// QATab.jsx - Q&A discussion tab component for company detail view

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Spinner from "./Spinner";
import useAutoRefresh from "../hooks/useAutoRefresh";
import "../styles/qa.css";

const QATab = ({ companyId }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const currentUserId = user?.id || user?._id;
  const isAdmin = user?.role === "admin";
  const isSenior = user?.role === "senior";
  const isVerifiedSenior = isSenior && Boolean(user?.isVerified);
  const canAsk = isAuthenticated && user?.role === "junior";

  // Questions list state
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ask question form state
  const [questionText, setQuestionText] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  // Expanded questions state: map questionId -> detailed object with answers
  const [expandedDetails, setExpandedDetails] = useState({});
  const [expandedLoading, setExpandedLoading] = useState({});

  // Answer forms state: map questionId -> string
  const [answerInputs, setAnswerInputs] = useState({});
  const [answering, setAnswering] = useState({});
  const [answerErrors, setAnswerErrors] = useState({});

  // Upvote/Action in-progress flags
  const [actionBusy, setActionBusy] = useState({});

  // Fetch questions for this company
  const fetchQuestions = useCallback(
    async ({ isBackground = false } = {}) => {
      if (!isBackground) {
        setLoading(true);
      }
      setError("");
      try {
        const res = await api.get(`/qa/questions?company=${companyId}`);
        setQuestions(res.data?.data || []);
      } catch (err) {
        if (!isBackground) {
          setError(err.response?.data?.message || "Failed to load questions.");
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (companyId) {
      fetchQuestions({ isBackground: false });
    }
  }, [companyId, fetchQuestions]);

  // Auto refresh Q&A tab (focus + 30s)
  useAutoRefresh(fetchQuestions, {
    intervalMs: 30000,
    enabled: Boolean(companyId),
  });

  // Fetch single question with answers when expanding
  const fetchQuestionDetail = async (qId) => {
    setExpandedLoading((prev) => ({ ...prev, [qId]: true }));
    try {
      const res = await api.get(`/qa/questions/${qId}`);
      setExpandedDetails((prev) => ({ ...prev, [qId]: res.data?.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load answers.");
    } finally {
      setExpandedLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // Toggle expand
  const handleToggleExpand = (qId) => {
    if (expandedDetails[qId]) {
      // Collapse
      setExpandedDetails((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    } else {
      // Expand
      fetchQuestionDetail(qId);
    }
  };

  // Submit new question
  const handleAskSubmit = async (e) => {
    e.preventDefault();
    setAskError("");
    const trimmed = questionText.trim();
    if (!trimmed) {
      setAskError("Question text is required.");
      return;
    }
    if (trimmed.length > 500) {
      setAskError("Question must be 500 characters or less.");
      return;
    }

    setAsking(true);
    try {
      await api.post("/qa/questions", { company: companyId, text: trimmed });
      setQuestionText("");
      await fetchQuestions();
    } catch (err) {
      setAskError(err.response?.data?.message || "Failed to post question.");
    } finally {
      setAsking(false);
    }
  };

  // Submit an answer
  const handleAnswerSubmit = async (qId, e) => {
    e.preventDefault();
    setAnswerErrors((prev) => ({ ...prev, [qId]: "" }));
    const text = (answerInputs[qId] || "").trim();
    if (!text) {
      setAnswerErrors((prev) => ({ ...prev, [qId]: "Answer text is required." }));
      return;
    }
    if (text.length > 1000) {
      setAnswerErrors((prev) => ({ ...prev, [qId]: "Answer must be 1000 characters or less." }));
      return;
    }

    setAnswering((prev) => ({ ...prev, [qId]: true }));
    try {
      await api.post(`/qa/questions/${qId}/answers`, { text });
      setAnswerInputs((prev) => ({ ...prev, [qId]: "" }));
      // Refresh question detail and list (for answerCount)
      await fetchQuestionDetail(qId);
      const res = await api.get(`/qa/questions?company=${companyId}`);
      setQuestions(res.data?.data || []);
    } catch (err) {
      setAnswerErrors((prev) => ({
        ...prev,
        [qId]: err.response?.data?.message || "Failed to post answer.",
      }));
    } finally {
      setAnswering((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // Toggle answer upvote
  const handleToggleUpvote = async (answerId, qId) => {
    if (!isAuthenticated) {
      toast.info("Please log in to upvote answers.");
      return;
    }
    if (actionBusy[answerId]) return;

    setActionBusy((prev) => ({ ...prev, [answerId]: true }));
    try {
      await api.post(`/qa/answers/${answerId}/upvote`);
      await fetchQuestionDetail(qId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update upvote.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  // Mark best answer
  const handleMarkBest = async (answerId, qId) => {
    if (actionBusy[answerId]) return;
    setActionBusy((prev) => ({ ...prev, [answerId]: true }));
    try {
      await api.patch(`/qa/answers/${answerId}/best`);
      toast.success("Marked as best answer.");
      await fetchQuestionDetail(qId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as best answer.");
    } finally {
      setActionBusy((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  // Delete question
  const handleDeleteQuestion = async (qId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question and all its answers? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/qa/questions/${qId}`);
      toast.success("Question deleted.");
      setExpandedDetails((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
      await fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete question.");
    }
  };

  // Delete answer
  const handleDeleteAnswer = async (ansId, qId) => {
    const confirmed = window.confirm("Are you sure you want to delete this answer?");
    if (!confirmed) return;

    try {
      await api.delete(`/qa/answers/${ansId}`);
      toast.success("Answer deleted.");
      await fetchQuestionDetail(qId);
      const res = await api.get(`/qa/questions?company=${companyId}`);
      setQuestions(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete answer.");
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

  return (
    <div className="qa-container">
      {/* ── Ask Question Section ── */}
      <div className="card qa-ask-card">
        <h3 className="qa-ask-title">Ask a Question</h3>
        {canAsk ? (
          <form onSubmit={handleAskSubmit} className="qa-ask-form">
            {askError && <div className="form-error">{askError}</div>}
            <div>
              <textarea
                className="input"
                rows={3}
                placeholder="Ask about the interview process, rounds, topics, or preparation..."
                value={questionText}
                maxLength={500}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />
              <div className="qa-char-count">{questionText.length} / 500</div>
            </div>
            <div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={asking || !questionText.trim()}
              >
                {asking ? "Posting..." : "Post Question"}
              </button>
            </div>
          </form>
        ) : isAuthenticated ? (
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
            Only juniors can ask questions.
          </p>
        ) : (
          <div className="qa-login-hint">
            Have questions about this company?{" "}
            <Link to="/login" style={{ fontWeight: 600, color: "var(--blue)" }}>
              Log in to ask
            </Link>
          </div>
        )}
      </div>

      {/* ── Questions List Section ── */}
      {loading ? (
        <Spinner message="Loading questions..." />
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : questions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h3 style={{ marginBottom: 8, color: "var(--navy)" }}>No Questions Yet</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Be the first to ask a question about this company's hiring process!
          </p>
        </div>
      ) : (
        <div className="qa-list">
          {questions.map((q) => {
            const isExpanded = Boolean(expandedDetails[q._id]);
            const isLoadingDetail = Boolean(expandedLoading[q._id]);
            const detail = expandedDetails[q._id];
            const askerId = q.askedBy?._id || q.askedBy;
            const isQuestionOwner =
              currentUserId && askerId && String(currentUserId) === String(askerId);
            const canDeleteQuestion = isQuestionOwner || isAdmin;

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
                        💬 {q.answerCount || 0} answer{q.answerCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {canDeleteQuestion && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          padding: "2px 8px",
                          fontSize: "0.75rem",
                          color: "var(--danger)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q._id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                    <span className="qa-expand-indicator">
                      {isExpanded ? "▲ Collapse" : "▼ Answers"}
                    </span>
                  </div>
                </div>

                {/* Expanded answers */}
                {isExpanded && (
                  <div className="qa-answers-expanded">
                    {isLoadingDetail ? (
                      <Spinner message="Loading answers..." />
                    ) : (
                      <>
                        {detail?.answers?.length === 0 ? (
                          <p style={{ color: "var(--muted)", fontStyle: "italic", margin: "8px 0" }}>
                            No answers yet for this question.
                          </p>
                        ) : (
                          detail?.answers?.map((ans) => {
                            const ansAuthorId = ans.answeredBy?._id || ans.answeredBy;
                            const isAnswerOwner =
                              currentUserId &&
                              ansAuthorId &&
                              String(currentUserId) === String(ansAuthorId);
                            const canDeleteAnswer = isAnswerOwner || isAdmin;
                            const hasUpvoted =
                              isAuthenticated &&
                              ans.upvotes?.some(
                                (u) => String(typeof u === "string" ? u : u?._id) === String(currentUserId)
                              );

                            return (
                              <div
                                key={ans._id}
                                className={`qa-answer-card ${ans.isBest ? "is-best" : ""}`}
                              >
                                <div className="qa-answer-header">
                                  <div className="qa-answer-author">
                                    <span>{ans.answeredBy?.name || "Senior"}</span>
                                    <span className="badge badge-cyan">
                                      {ans.answeredBy?.role || "senior"}
                                    </span>
                                    {ans.isBest && (
                                      <span className="badge badge-success">
                                        ✓ Best Answer
                                      </span>
                                    )}
                                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400 }}>
                                      {formatDate(ans.createdAt)}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {isQuestionOwner && !ans.isBest && (
                                      <button
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                                        disabled={actionBusy[ans._id]}
                                        onClick={() => handleMarkBest(ans._id, q._id)}
                                      >
                                        Mark as best
                                      </button>
                                    )}

                                    {canDeleteAnswer && (
                                      <button
                                        type="button"
                                        className="btn btn-outline"
                                        style={{
                                          padding: "3px 8px",
                                          fontSize: "0.75rem",
                                          color: "var(--danger)",
                                        }}
                                        onClick={() => handleDeleteAnswer(ans._id, q._id)}
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="qa-answer-text">{ans.text}</div>

                                <div className="qa-answer-actions">
                                  <button
                                    type="button"
                                    className={`btn btn-outline ${hasUpvoted ? "btn-action-active" : ""}`}
                                    style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                                    disabled={actionBusy[ans._id]}
                                    onClick={() => handleToggleUpvote(ans._id, q._id)}
                                  >
                                    ▲ {hasUpvoted ? "Upvoted" : "Upvote"} ({ans.upvotes?.length || 0})
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Answer Form for Verified Seniors */}
                        {isVerifiedSenior ? (
                          <div className="qa-answer-form-wrapper">
                            <div className="qa-answer-form-title">Your Answer</div>
                            {answerErrors[q._id] && (
                              <div className="form-error" style={{ marginBottom: 10 }}>
                                {answerErrors[q._id]}
                              </div>
                            )}
                            <form onSubmit={(e) => handleAnswerSubmit(q._id, e)}>
                              <textarea
                                className="input"
                                rows={3}
                                placeholder="Write your answer or tips (max 1000 characters)..."
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
                                  style={{ padding: "6px 16px", fontSize: "0.85rem" }}
                                  disabled={
                                    answering[q._id] || !(answerInputs[q._id] || "").trim()
                                  }
                                >
                                  {answering[q._id] ? "Submitting..." : "Submit Answer"}
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : isSenior && !user?.isVerified ? (
                          <div className="qa-senior-pending-notice">
                            Your account is pending verification. Only verified seniors can post answers.
                          </div>
                        ) : null}
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
  );
};

export default QATab;

