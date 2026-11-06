// Signup.jsx - Role-based registration for Juniors, Seniors, and Admins

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "junior",
    branch: "",
    placedCompany: "",
    placedYear: "",
    adminCode: "",
  });

  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [seniorNotice, setSeniorNotice] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic frontend checks
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.role === "senior") {
      if (!formData.placedCompany.trim() || !formData.placedYear) {
        setError("Placed company and placed year are required for seniors.");
        return;
      }
      if (!proofFile) {
        setError("Proof document (offer letter or email screenshot) is required for senior verification.");
        return;
      }
      // Client validation for proof file: PDF/JPG/PNG, max 5 MB
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(proofFile.type)) {
        setError("Invalid file type. Please upload a PDF, JPG, or PNG document.");
        return;
      }
      if (proofFile.size > 5 * 1024 * 1024) {
        setError("Proof file size must be less than 5 MB.");
        return;
      }
    }

    if (formData.role === "admin") {
      if (!formData.adminCode.trim()) {
        setError("Admin code is required for admin signup.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let payload;

      if (formData.role === "senior") {
        payload = new FormData();
        payload.append("name", formData.name.trim());
        payload.append("email", formData.email.trim());
        payload.append("password", formData.password);
        payload.append("role", formData.role);
        if (formData.branch.trim()) payload.append("branch", formData.branch.trim());
        payload.append("placedCompany", formData.placedCompany.trim());
        payload.append("placedYear", formData.placedYear);
        payload.append("proof", proofFile);
      } else {
        payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          branch: formData.branch.trim() || undefined,
        };

        if (formData.role === "admin") {
          payload.adminCode = formData.adminCode.trim();
        }
      }

      const res = await signup(payload);

      // If senior, show verification notice before redirect
      if (formData.role === "senior" && !res.user?.isVerified) {
        setSeniorNotice(true);
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create account.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: "48px 16px" }}>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 8, textAlign: "center" }}>Create your account</h2>
        <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: 24, fontSize: "0.95rem" }}>
          Join Placely to prepare for campus placements
        </p>

        {/* Notice for newly registered seniors */}
        {seniorNotice ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div className="alert-notice" style={{ marginBottom: 20 }}>
              <strong>Registration successful!</strong>
              <p style={{ marginTop: 6 }}>
                Your account is pending admin verification. You can browse companies while you wait for approval.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => navigate("/")}
            >
              Continue to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

            {/* Name */}
            <div className="form-group">
              <label className="label" htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="e.g. Aditi Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@college.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="password">
                Password * (min 6 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Role selector */}
            <div className="form-group">
              <label className="label" htmlFor="role">
                I am a *
              </label>
              <select
                id="role"
                name="role"
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="junior">Junior (Preparing for placements)</option>
                <option value="senior">Senior (Placed student)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Optional Branch */}
            <div className="form-group">
              <label className="label" htmlFor="branch">
                Branch / Major (optional)
              </label>
              <input
                id="branch"
                name="branch"
                type="text"
                className="input"
                placeholder="e.g. CSE, ECE, Mechanical"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>

            {/* Senior-specific fields */}
            {formData.role === "senior" && (
              <>
                <div className="form-group">
                  <label className="label" htmlFor="placedCompany">
                    Placed Company *
                  </label>
                  <input
                    id="placedCompany"
                    name="placedCompany"
                    type="text"
                    className="input"
                    placeholder="e.g. Google, Microsoft, TCS"
                    value={formData.placedCompany}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="placedYear">
                    Placement Year *
                  </label>
                  <input
                    id="placedYear"
                    name="placedYear"
                    type="number"
                    min="2010"
                    max="2030"
                    className="input"
                    placeholder="e.g. 2025"
                    value={formData.placedYear}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Proof Upload Field */}
                <div className="form-group">
                  <label className="label" htmlFor="proof">
                    Placement Proof Document * (PDF, JPG, PNG - max 5 MB)
                  </label>
                  <input
                    id="proof"
                    name="proof"
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    className="input"
                    onChange={(e) => {
                      setProofFile(e.target.files?.[0] || null);
                      setError("");
                    }}
                    required
                  />
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>
                    Used only by admins to verify your placement. Deleted after review.
                  </p>
                </div>
              </>
            )}

            {/* Admin-specific field */}
            {formData.role === "admin" && (
              <div className="form-group">
                <label className="label" htmlFor="adminCode">
                  Admin Passcode *
                </label>
                <input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  className="input"
                  placeholder="Enter administrator passcode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        )}

        {!seniorNotice && (
          <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.9rem", color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;

