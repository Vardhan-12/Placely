// CompanyDetail.jsx - Detailed company profile with Overview, Experiences, and Q&A tabs

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import QATab from "../components/QATab";
import "../styles/companies.css";

// Helper: Format package range
const formatPackageRange = (min, max) => {
  if (min !== undefined && max !== undefined && min !== null && max !== null) {
    if (min === max) return `${min} LPA`;
    return `${min} - ${max} LPA`;
  }
  if (min !== undefined && min !== null) return `From ${min} LPA`;
  if (max !== undefined && max !== null) return `Up to ${max} LPA`;
  return "Not disclosed";
};

// Helper: Format next drive date
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Helper: Return badge class for interview result
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

// Helper: Return badge class for difficulty
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

const CompanyDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  // Experiences tab state
  const [experiences, setExperiences] = useState([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expSort, setExpSort] = useState("latest");

  // Fetch company details
  useEffect(() => {
    let isMounted = true;
    const fetchCompany = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/companies/${id}`);
        if (isMounted) {
          setCompany(res.data?.data || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Company not found or invalid ID"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCompany();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch experiences when Experiences tab is active or sort changes
  useEffect(() => {
    if (activeTab !== "experiences" || !company) return;

    let isMounted = true;
    const fetchExperiences = async () => {
      setExpLoading(true);
      try {
        const res = await api.get("/experiences", {
          params: {
            company: id,
            sort: expSort,
          },
        });
        if (isMounted) {
          setExperiences(res.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch experiences", err);
      } finally {
        if (isMounted) {
          setExpLoading(false);
        }
      }
    };

    fetchExperiences();
    return () => {
      isMounted = false;
    };
  }, [id, activeTab, expSort, company]);

  if (loading) {
    return <Spinner message="Loading company details..." />;
  }

  // Error or Not Found state
  if (error || !company) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <EmptyState
          title="Company not found"
          message="We couldn't find the company you're looking for. It may have been deleted or the link is invalid."
          action={
            <Link to="/companies" className="btn btn-primary">
              Back to Companies
            </Link>
          }
        />
      </div>
    );
  }

  // Check if current user is a verified senior eligible to write an experience
  const isVerifiedSenior =
    isAuthenticated && user?.role === "senior" && Boolean(user?.isVerified);

  return (
    <div className="container" style={{ padding: "36px 16px" }}>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link
          to="/companies"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.9rem",
            color: "var(--muted)",
          }}
        >
          ← Back to all companies
        </Link>
      </div>

      {/* Header Profile Box */}
      <div className="company-detail-header">
        <div className="company-detail-top">
          <div>
            <h1 className="company-detail-name">{company.name}</h1>
            <div className="company-header-badges">
              {company.roles &&
                company.roles.map((role, idx) => (
                  <span key={idx} className="badge badge-gray">
                    {role}
                  </span>
                ))}
              {company.isUpcoming && (
                <span className="badge badge-cyan">Upcoming Drive</span>
              )}
              {company.isUpcoming && company.nextDriveDate && (
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  Drive Date: {formatDate(company.nextDriveDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="company-detail-stats">
          <div className="detail-stat-box">
            <span className="stat-label">Salary Package</span>
            <span className="stat-val">
              {formatPackageRange(company.packageMin, company.packageMax)}
            </span>
          </div>

          <div className="detail-stat-box">
            <span className="stat-label">Min. CGPA Required</span>
            <span className="stat-val">
              {company.cgpaCutoff !== undefined && company.cgpaCutoff !== null
                ? `${company.cgpaCutoff} CGPA`
                : "No cutoff"}
            </span>
          </div>

          <div className="detail-stat-box">
            <span className="stat-label">Rounds</span>
            <span className="stat-val">{company.rounds?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "experiences" ? "active" : ""}`}
          onClick={() => setActiveTab("experiences")}
        >
          Experiences
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "qa" ? "active" : ""}`}
          onClick={() => setActiveTab("qa")}
        >
          Q&A
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div>
          {/* Company Description */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>About {company.name}</h3>
            <p
              style={{
                color: company.description ? "var(--text)" : "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              {company.description || "No description provided for this company."}
            </p>
          </div>

          {/* Hiring / Interview Rounds */}
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Interview & Selection Rounds</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: 16 }}>
              Standard evaluation workflow reported for this placement drive.
            </p>

            {company.rounds && company.rounds.length > 0 ? (
              <div className="rounds-timeline">
                {company.rounds.map((round, index) => (
                  <div key={round._id || index} className="round-item-card">
                    <div className="round-step-num">{index + 1}</div>
                    <div className="round-info">
                      <div className="round-title-row">
                        <span className="round-title">{round.name}</span>
                        <span className="badge badge-blue">{round.type}</span>
                      </div>
                      {round.description && (
                        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                          {round.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
                No round details listed yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPERIENCES */}
      {activeTab === "experiences" && (
        <div>
          <div className="experiences-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                Sort by:
              </span>
              <select
                className="input"
                style={{ width: "auto", padding: "6px 12px" }}
                value={expSort}
                onChange={(e) => setExpSort(e.target.value)}
              >
                <option value="latest">Latest</option>
                <option value="upvotes">Most Upvoted</option>
              </select>
            </div>

            {/* If verified senior, show Write Experience CTA */}
            {isVerifiedSenior && (
              <Link
                to={`/experiences/new?company=${company._id}`}
                className="btn btn-primary"
              >
                Write Experience
              </Link>
            )}
          </div>

          {expLoading ? (
            <Spinner message="Loading interview experiences..." />
          ) : experiences.length === 0 ? (
            <EmptyState
              title="No experiences yet"
              message={`Be the first to share your interview experience at ${company.name}!`}
              action={
                isVerifiedSenior ? (
                  <Link
                    to={`/experiences/new?company=${company._id}`}
                    className="btn btn-primary"
                  >
                    Share Experience
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="experiences-list">
              {experiences.map((exp) => (
                <Link
                  key={exp._id}
                  to={`/experiences/${exp._id}`}
                  className="card experience-card-item"
                >
                  <div className="experience-card-top">
                    <div>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>
                        {exp.role} ({exp.year})
                      </h3>
                      <p className="experience-author-meta">
                        Shared by{" "}
                        <strong>{exp.author?.name || "Anonymous"}</strong>
                        {exp.packageLPA ? ` • ${exp.packageLPA} LPA` : ""}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {exp.result && (
                        <span className={getResultBadgeClass(exp.result)}>
                          {exp.result}
                        </span>
                      )}
                      {exp.difficulty && (
                        <span className={getDifficultyBadgeClass(exp.difficulty)}>
                          {exp.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid var(--border)",
                      fontSize: "0.875rem",
                      color: "var(--muted)",
                    }}
                  >
                    <span>
                      {exp.rounds?.length || 0} rounds detailed
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--navy)" }}>
                      ▲ {exp.upvotes?.length || 0} upvotes
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Q&A */}
      {activeTab === "qa" && <QATab companyId={id} />}
    </div>
  );
};

export default CompanyDetail;

