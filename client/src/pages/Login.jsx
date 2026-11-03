// Login.jsx - User login page with validation and server error display

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

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
      navigate(from, { replace: true });
    } catch (err) {
      // Display server error message
      const msg = err.response?.data?.message || err.message || "Failed to log in. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: "48px 16px" }}>
      <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 8, textAlign: "center" }}>Welcome back</h2>
        <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: 24, fontSize: "0.95rem" }}>
          Log in to your Placely account
        </p>

        {error && (
          <div className="alert-warning" style={{ color: "var(--danger)", borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.9rem", color: "var(--muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

