// ExperienceForm.jsx - Create and Edit Interview Experience with dynamic rounds builder

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Spinner from "../components/Spinner";
import "../styles/experiences.css";

const ROUND_TYPES = ["aptitude", "coding", "technical", "hr", "other"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const RESULTS = [
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
  { value: "waiting", label: "Waiting / In Process" },
];

const ExperienceForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedCompanyId = searchParams.get("company") || "";

  const isEditMode = Boolean(id);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Loading & Error states
  const [loading, setLoading] = useState(isEditMode);
  const [companies, setCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Main Form fields
  const [company, setCompany] = useState(preselectedCompanyId);
  const [year, setYear] = useState(new Date().getFullYear());
  const [role, setRole] = useState("");
  const [packageLPA, setPackageLPA] = useState("");
  const [result, setResult] = useState("selected");
  const [difficulty, setDifficulty] = useState("medium");
  const [tips, setTips] = useState("");
  const [mistakes, setMistakes] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Dynamic Resources list
  const [resources, setResources] = useState([""]);

  // Dynamic Rounds list
  const [rounds, setRounds] = useState([
    {
      type: "coding",
      durationMinutes: 60,
      difficulty: "medium",
      topicsInput: "",
      notes: "",
    },
  ]);

  // Load companies for the dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/companies?sort=name");
        if (isMounted) {
          setCompanies(res.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    };

    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // In edit mode, load existing experience from the owner's own list (avoids anonymous author-id leak)
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    const fetchExisting = async () => {
      setLoading(true);
      try {
        // Load from /mine so anonymous posts are still accessible to their author,
        // and the server rejects (403) if someone else tries to edit via PUT.
        const listRes = await api.get("/experiences/mine");
        const list = listRes.data?.data || [];
        const exp = list.find((e) => e._id === id);

        if (!exp) {
          // Not the author — fall back to public endpoint so the server's PUT
          // will return 403, which we surface as a readable error on submit.
          const pubRes = await api.get(`/experiences/${id}`);
          const pubExp = pubRes.data?.data;
          if (isMounted && pubExp) {
            setServerError("You are not authorised to edit this experience.");
          }
          return;
        }

        if (isMounted) {
          setCompany(exp.company?._id || exp.company || "");
          setYear(exp.year || new Date().getFullYear());
          setRole(exp.role || "");
          setPackageLPA(exp.packageLPA !== undefined ? String(exp.packageLPA) : "");
          setResult(exp.result || "selected");
          setDifficulty(exp.difficulty || "medium");
          setTips(exp.tips || "");
          setMistakes(exp.mistakes || "");
          setIsAnonymous(Boolean(exp.isAnonymous));
          setResources(exp.resources?.length ? exp.resources : [""]);

          if (exp.rounds?.length) {
            setRounds(
              exp.rounds.map((r) => ({
                type: r.type || "coding",
                durationMinutes: r.durationMinutes || "",
                difficulty: r.difficulty || "medium",
                topicsInput: (r.topics || []).join(", "),
                notes: r.notes || "",
              }))
            );
          }
        }
      } catch (err) {
        if (isMounted) {
          setServerError(err.response?.data?.message || "Failed to load experience for editing.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Role & Verification Guards
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: "48px 16px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
          <h3 style={{ marginBottom: 12 }}>Authentication Required</h3>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Please log in with a verified senior account to share your placement experience.
          </p>
          <Link to="/login" className="btn btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Check if senior is unverified
  if (user?.role === "senior" && !user?.isVerified) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <div className="card" style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
          <div className="alert-notice" style={{ marginBottom: 16 }}>
            <strong>Your account is pending admin verification.</strong>
          </div>
          <h3 style={{ marginBottom: 12 }}>Verification Required</h3>
          <p style={{ color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Placement experience posts are restricted to verified seniors to maintain high quality and trusted insights for juniors. Once an administrator approves your profile, you will be able to publish experiences.
          </p>
          <Link to="/companies" className="btn btn-outline">
            Browse Companies
          </Link>
        </div>
      </div>
    );
  }

  // Only seniors can create new experiences
  if (!isEditMode && user?.role !== "senior") {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <div className="card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ marginBottom: 12, color: "var(--danger)" }}>Access Denied</h3>
          <p style={{ color: "var(--muted)" }}>
            Only verified seniors can post interview experiences.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Spinner message="Loading experience form..." />;
  }

  // --- Dynamic Rounds Helpers ---
  const handleAddRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        type: "coding",
        durationMinutes: 60,
        difficulty: "medium",
        topicsInput: "",
        notes: "",
      },
    ]);
  };

  const handleRemoveRound = (index) => {
    setRounds((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRoundChange = (index, field, value) => {
    setRounds((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleMoveRound = (index, direction) => {
    setRounds((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // --- Dynamic Resources Helpers ---
  const handleAddResource = () => {
    setResources((prev) => [...prev, ""]);
  };

  const handleRemoveResource = (index) => {
    setResources((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleResourceChange = (index, value) => {
    setResources((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Client Validation
  const validate = () => {
    const errors = {};
    if (!company) errors.company = "Company is required";
    if (!role.trim()) errors.role = "Role is required";
    if (!year || isNaN(year)) errors.year = "Valid placement year is required";
    if (!result) errors.result = "Interview result is required";
    return errors;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFieldErrors({});

    // Process rounds
    const processedRounds = rounds.map((r) => ({
      type: r.type,
      durationMinutes: r.durationMinutes ? Number(r.durationMinutes) : undefined,
      difficulty: r.difficulty || undefined,
      topics: r.topicsInput
        ? r.topicsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      notes: r.notes.trim() || undefined,
    }));

    // Process resources
    const processedResources = resources
      .map((r) => r.trim())
      .filter(Boolean);

    const payload = {
      company,
      year: Number(year),
      role: role.trim(),
      packageLPA: packageLPA ? Number(packageLPA) : undefined,
      result,
      difficulty,
      rounds: processedRounds,
      tips: tips.trim() || undefined,
      mistakes: mistakes.trim() || undefined,
      resources: processedResources,
      isAnonymous: Boolean(isAnonymous),
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        const res = await api.put(`/experiences/${id}`, payload);
        if (res.data?.success) {
          toast.success("Experience updated successfully.");
          navigate(`/experiences/${id}`);
        }
      } else {
        const res = await api.post("/experiences", payload);
        if (res.data?.success && res.data?.data?._id) {
          toast.success("Experience published successfully!");
          navigate(`/experiences/${res.data.data._id}`);
        } else {
          toast.success("Experience published successfully!");
          navigate("/companies");
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to save experience. Please check your inputs.";
      setServerError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="exp-container">
      <div style={{ marginBottom: 20 }}>
        <Link
          to={company ? `/companies/${company}` : "/companies"}
          style={{ fontSize: "0.9rem", color: "var(--muted)" }}
        >
          ← Cancel and go back
        </Link>
      </div>

      <div className="card" style={{ padding: "32px 36px" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: 8 }}>
          {isEditMode ? "Edit Placement Experience" : "Share Your Placement Experience"}
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: "0.95rem" }}>
          Help fellow juniors understand the interview process, rounds breakdown, and preparation strategies.
        </p>

        {serverError && (
          <div className="form-error" style={{ marginBottom: 20, fontSize: "0.95rem" }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company & Role */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="label" htmlFor="company">
                Company *
              </label>
              <select
                id="company"
                className="input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.company && (
                <div className="form-error">{fieldErrors.company}</div>
              )}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="role">
                Job Role / Title *
              </label>
              <input
                id="role"
                type="text"
                className="input"
                placeholder="e.g. SDE, Associate Analyst, Graduate Trainee"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
              {fieldErrors.role && (
                <div className="form-error">{fieldErrors.role}</div>
              )}
            </div>
          </div>

          {/* Year, Package, Result */}
          <div className="form-grid-3">
            <div className="form-group">
              <label className="label" htmlFor="year">
                Placement Year *
              </label>
              <input
                id="year"
                type="number"
                min="2015"
                max="2035"
                className="input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
              {fieldErrors.year && (
                <div className="form-error">{fieldErrors.year}</div>
              )}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="packageLPA">
                Package in LPA (optional)
              </label>
              <input
                id="packageLPA"
                type="number"
                step="0.1"
                min="0"
                className="input"
                placeholder="e.g. 14.5"
                value={packageLPA}
                onChange={(e) => setPackageLPA(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="result">
                Result *
              </label>
              <select
                id="result"
                className="input"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                required
              >
                {RESULTS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Overall Difficulty & Anonymous Checkbox */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="label" htmlFor="difficulty">
                Overall Difficulty
              </label>
              <select
                id="difficulty"
                className="input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", paddingTop: 28 }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--blue)" }}
                />
                Post anonymously (your name will be hidden from everyone)
              </label>
            </div>
          </div>

          {/* Section: Rounds Breakdown */}
          <div style={{ marginTop: 24, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", color: "var(--navy)" }}>
                  Interview Rounds Breakdown
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  Add each round you went through in sequential order.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddRound}
              >
                + Add Round
              </button>
            </div>

            <div className="form-rounds-container">
              {rounds.map((round, index) => (
                <div key={index} className="form-round-card">
                  <div className="form-round-top">
                    <span style={{ fontWeight: 700, color: "var(--navy)" }}>
                      Round {index + 1}
                    </span>

                    <div className="form-round-controls">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Move Up"
                        disabled={index === 0}
                        onClick={() => handleMoveRound(index, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Move Down"
                        disabled={index === rounds.length - 1}
                        onClick={() => handleMoveRound(index, 1)}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: "var(--danger)" }}
                        title="Remove Round"
                        onClick={() => handleRemoveRound(index)}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="label">Round Type</label>
                      <select
                        className="input"
                        value={round.type}
                        onChange={(e) =>
                          handleRoundChange(index, "type", e.target.value)
                        }
                      >
                        {ROUND_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        placeholder="e.g. 60"
                        value={round.durationMinutes}
                        onChange={(e) =>
                          handleRoundChange(index, "durationMinutes", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Difficulty</label>
                      <select
                        className="input"
                        value={round.difficulty}
                        onChange={(e) =>
                          handleRoundChange(index, "difficulty", e.target.value)
                        }
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d} value={d}>
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Topics Covered (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Trees, Dynamic Programming, SQL queries, OS concepts"
                      value={round.topicsInput}
                      onChange={(e) =>
                        handleRoundChange(index, "topicsInput", e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Questions / Round Notes</label>
                    <textarea
                      rows="3"
                      className="input"
                      placeholder="Describe questions asked, technical deep-dives, interviewer expectations..."
                      value={round.notes}
                      onChange={(e) =>
                        handleRoundChange(index, "notes", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Advice & Strategy */}
          <div className="form-group">
            <label className="label" htmlFor="tips">
              Preparation Tips & Strategy
            </label>
            <textarea
              id="tips"
              rows="4"
              className="input"
              placeholder="What topics should candidates focus on? Any specific patterns or communication tips?"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="mistakes">
              Mistakes to Avoid
            </label>
            <textarea
              id="mistakes"
              rows="3"
              className="input"
              placeholder="What common mistakes did you observe or commit that others should avoid?"
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
            />
          </div>

          {/* Section: Useful Resources */}
          <div className="form-group">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label className="label" style={{ marginBottom: 0 }}>
                Recommended Resources (links, sheets, books)
              </label>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "4px 10px", fontSize: "0.85rem" }}
                onClick={handleAddResource}
              >
                + Add Resource
              </button>
            </div>

            {resources.map((res, index) => (
              <div key={index} className="dynamic-item-row">
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. https://leetcode.com/discuss, Striver SDE Sheet"
                  value={res}
                  onChange={(e) => handleResourceChange(index, e.target.value)}
                />
                {resources.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ color: "var(--danger)" }}
                    onClick={() => handleRemoveResource(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: 32, display: "flex", gap: 14 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update Experience"
                : "Publish Experience"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={submitting}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceForm;

