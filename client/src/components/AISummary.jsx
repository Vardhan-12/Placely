// AISummary.jsx - AI-generated summary and preparation guide for company experiences

import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import "../styles/ai.css";

const AISummary = ({ companyId }) => {
  const { isAuthenticated, user } = useAuth();

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSummary = async (isRefresh = false) => {
    setLoading(true);
    setError("");
    try {
      const endpoint = isRefresh
        ? `/ai/company/${companyId}/summary/refresh`
        : `/ai/company/${companyId}/summary`;
      const res = isRefresh
        ? await api.post(endpoint)
        : await api.get(endpoint);

      setSummaryData(res.data);
      setHasFetched(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError("AI service is temporarily unavailable. Please try again later.");
      } else if (status === 429) {
        setError(
          err.response?.data?.message ||
            "Rate limit reached. Maximum 10 generation calls per hour. Please wait before trying again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load AI summary. Please try again."
        );
      }
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  };

  // 1. Logged out state
  if (!isAuthenticated) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <h3 style={{ marginBottom: 12, color: "var(--navy)" }}>
          Unlock AI Insights
        </h3>
        <p style={{ color: "var(--muted)", marginBottom: 20 }}>
          Log in to view AI-synthesized patterns, rounds breakdown, and interview tips from real student experiences.
        </p>
        <Link to="/login" className="btn btn-primary">
          Log in to view AI insights
        </Link>
      </div>
    );
  }

  // 2. Initial state (before user clicks "Generate summary")
  if (!hasFetched && !loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
        <h3 style={{ marginBottom: 12, color: "var(--navy)" }}>
          AI Interview Insights
        </h3>
        <p style={{ color: "var(--muted)", marginBottom: 24, maxWidth: 520, margin: "0 auto 24px" }}>
          Synthesize interview patterns, frequent topics, common rounds, and prep recommendations powered by AI across all verified experiences.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fetchSummary(false)}
        >
          Generate Summary
        </button>
      </div>
    );
  }

  // 3. Loading state
  if (loading) {
    return (
      <div style={{ padding: "48px 0" }}>
        <Spinner text="Synthesizing interview insights with Gemini AI..." />
      </div>
    );
  }

  // 4. Error state (503, 429, or general error)
  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "36px 24px" }}>
        <div
          style={{
            color: "var(--danger)",
            fontSize: "1.05rem",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => fetchSummary(false)}
        >
          Try Again
        </button>
      </div>
    );
  }

  // 5. Not enough data (less than 3 experiences)
  if (summaryData && !summaryData.enoughData) {
    return (
      <EmptyState
        title="Not Enough Experiences"
        message={
          summaryData.message ||
          `This company currently has ${summaryData.count || 0} experience(s). Placely requires at least 3 experiences to produce an accurate AI summary.`
        }
      />
    );
  }

  const summary = summaryData?.data;
  const count = summaryData?.count || 0;
  const generatedDateStr = summaryData?.generatedAt
    ? new Date(summaryData.generatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  if (!summary) {
    return (
      <EmptyState
        title="No Summary Available"
        message="Could not load summary details for this company."
      />
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="ai-summary-container">
      {/* Top action / info bar */}
      <div className="ai-summary-header">
        <div>
          <h2 className="ai-summary-title">AI Interview Summary</h2>
          <p className="ai-summary-subtitle">
            Synthesized across {count} candidate experience{count === 1 ? "" : "s"}
            {summaryData.cached ? " • Cached" : " • Freshly generated"}
          </p>
        </div>
        <div className="ai-actions">
          {isAdmin && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fetchSummary(true)}
              title="Force Gemini to re-generate the summary"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* 1. Overview */}
      {summary.overview && (
        <div className="ai-card">
          <h3 className="ai-card-title">Overview</h3>
          <p className="ai-card-text">{summary.overview}</p>
        </div>
      )}

      {/* 2. Common Rounds */}
      {Array.isArray(summary.commonRounds) && summary.commonRounds.length > 0 && (
        <div className="ai-card">
          <h3 className="ai-card-title">Common Interview Rounds</h3>
          <div className="ai-rounds-list">
            {summary.commonRounds.map((roundObj, idx) => (
              <div key={idx} className="ai-round-item">
                <div className="ai-round-name">{roundObj.round}</div>
                <p className="ai-round-desc">{roundObj.whatToExpect}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Top Topics */}
      {Array.isArray(summary.topTopics) && summary.topTopics.length > 0 && (
        <div className="ai-card">
          <h3 className="ai-card-title">Top Evaluated Topics</h3>
          <div className="ai-topics-grid">
            {summary.topTopics.map((topicObj, idx) => (
              <div key={idx} className="ai-topic-badge">
                <span>{topicObj.topic}</span>
                {topicObj.frequency && (
                  <span className="ai-topic-freq">{topicObj.frequency}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Difficulty Assessment */}
      {summary.difficultyAssessment && (
        <div className="ai-card">
          <h3 className="ai-card-title">Difficulty Assessment</h3>
          <p className="ai-card-text">{summary.difficultyAssessment}</p>
        </div>
      )}

      {/* 5. Top Tips & Common Mistakes in 2 Columns */}
      <div className="ai-two-col">
        {Array.isArray(summary.topTips) && summary.topTips.length > 0 && (
          <div className="ai-card">
            <h3 className="ai-card-title">Top Tips</h3>
            <ul className="ai-bullet-list">
              {summary.topTips.map((tip, idx) => (
                <li key={idx} className="ai-bullet-item">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(summary.commonMistakes) &&
          summary.commonMistakes.length > 0 && (
            <div className="ai-card">
              <h3 className="ai-card-title">Common Mistakes</h3>
              <ul className="ai-bullet-list">
                {summary.commonMistakes.map((mistake, idx) => (
                  <li
                    key={idx}
                    className="ai-bullet-item ai-bullet-mistake"
                  >
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* 6. Recommended Resources */}
      {Array.isArray(summary.recommendedResources) &&
        summary.recommendedResources.length > 0 && (
          <div className="ai-card">
            <h3 className="ai-card-title">Recommended Resources</h3>
            <ul className="ai-bullet-list">
              {summary.recommendedResources.map((resItem, idx) => (
                <li key={idx} className="ai-bullet-item">
                  {resItem}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* 7. Prep Plan */}
      {Array.isArray(summary.prepPlan) && summary.prepPlan.length > 0 && (
        <div className="ai-card">
          <h3 className="ai-card-title">Suggested Prep Plan</h3>
          <div className="ai-prep-list">
            {summary.prepPlan.map((step, idx) => (
              <div key={idx} className="ai-prep-step">
                <span className="ai-prep-number">{idx + 1}</span>
                <div>{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="ai-summary-footer">
        Based on {count} experiences - generated {generatedDateStr} - AI generated, verify with seniors
      </div>
    </div>
  );
};

export default AISummary;

