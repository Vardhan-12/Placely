// Login.jsx - User login page with full-viewport split screen

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AuthBrandPanel from "../components/AuthBrandPanel";
import "../styles/auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Real facts from API
  const [companyCount, setCompanyCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [experiences, setExperiences] = useState([]);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [compRes, expRes, qRes] = await Promise.all([
          api.get("/companies"),
          api.get("/experiences?sort=latest"),
          api.get("/qa/questions"),
        ]);
        if (isMounted) {
          setCompanyCount(compRes.data?.count ?? (compRes.data?.data?.length || 0));
          const expList = expRes.data?.data || [];
          setExperienceCount(expRes.data?.count ?? expList.length);
          setExperiences(expList);
          setQuestionCount(qRes.data?.count ?? (qRes.data?.data?.length || 0));
        }
      } catch (e) {
        // fail silently for background facts
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Logged in successfully!");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to log in. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <AuthBrandPanel
        companyCount={companyCount}
        experienceCount={experienceCount}
        questionCount={questionCount}
        experiences={experiences}
      />

      {/* ── Right: Form card ── */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Sign in to your account</h2>
            <p>Access campus interview records and peer discussions</p>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@lpu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div className="form-field-hint">Use your college email, e.g. you@lpu.in.</div>
            </div>

            <div className="auth-form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-form-footer">
            Don't have an account?{" "}<Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
