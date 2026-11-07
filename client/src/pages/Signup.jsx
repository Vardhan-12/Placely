// Signup.jsx - Role-based registration for Juniors, Seniors, and Admins

import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// Helper: format bytes nicely
const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Helper: Title Case formatter
const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [seniorNotice, setSeniorNotice] = useState(false);

  const fileInputRef = useRef(null);

  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Password rules validation
  const pwd = formData.password;
  const rules = {
    length: pwd.length >= 6,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };

  const allRulesPassed =
    rules.length &&
    rules.uppercase &&
    rules.lowercase &&
    rules.number &&
    rules.special;

  const passwordsMatch = confirmPassword.length > 0 && formData.password === confirmPassword;
  const showMismatchError = confirmPassword.length > 0 && formData.password !== confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleNameBlur = () => {
    if (formData.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        name: toTitleCase(prev.name.trim()),
      }));
    }
  };

  const handleFileSelect = (file) => {
    setFileError("");
    setError("");
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Invalid file type. Please upload a PDF, JPG, or PNG document.");
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("Proof file size must be less than 5 MB.");
      setProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setProofFile(file);
  };

  const handleRemoveProof = (e) => {
    e.stopPropagation();
    setProofFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    // Password requirements check
    if (!allRulesPassed) {
      setError("Password must meet all 5 requirements.");
      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
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
        toast.info("Registration submitted. Under admin review.");
        setSeniorNotice(true);
      } else {
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create account.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = submitting || !allRulesPassed || !passwordsMatch;

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
                placeholder="Ex: Bala Vardhan"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleNameBlur}
                required
              />
              <div className="form-field-hint">
                Use your real name. It is shown as Title Case, e.g. Bala Vardhan.
              </div>
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
                placeholder="Ex: you@lpu.in"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <div className="form-field-hint">
                Use your college email, e.g. you@lpu.in.
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="password">
                Password *
              </label>
              <div className="password-field-container">
                <div className="password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Rules Popover (visible while password field is focused) */}
                {passwordFocused && (
                  <div className="password-rules-popover">
                    <div className="password-rules-title">Password requirements</div>
                    <div className={`password-rule-item ${rules.length ? "valid" : ""}`}>
                      <span className="password-rule-icon">{rules.length ? "✓" : "○"}</span>
                      <span>Minimum 6 characters</span>
                    </div>
                    <div className={`password-rule-item ${rules.uppercase ? "valid" : ""}`}>
                      <span className="password-rule-icon">{rules.uppercase ? "✓" : "○"}</span>
                      <span>An uppercase letter</span>
                    </div>
                    <div className={`password-rule-item ${rules.lowercase ? "valid" : ""}`}>
                      <span className="password-rule-icon">{rules.lowercase ? "✓" : "○"}</span>
                      <span>A lowercase letter</span>
                    </div>
                    <div className={`password-rule-item ${rules.number ? "valid" : ""}`}>
                      <span className="password-rule-icon">{rules.number ? "✓" : "○"}</span>
                      <span>A number</span>
                    </div>
                    <div className={`password-rule-item ${rules.special ? "valid" : ""}`}>
                      <span className="password-rule-icon">{rules.special ? "✓" : "○"}</span>
                      <span>A special character</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="label" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <div className="password-input-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {showMismatchError && (
                <div style={{ color: "var(--danger)", fontSize: "0.82rem", marginTop: 4 }}>
                  Passwords do not match
                </div>
              )}
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
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
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

                {/* Proof Upload Field (Custom Dashed Box) */}
                <div className="form-group">
                  <label className="label" htmlFor="proof">
                    Placement Proof Document *
                  </label>

                  {/* Hidden native input */}
                  <input
                    id="proof"
                    name="proof"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      handleFileSelect(e.target.files?.[0] || null);
                    }}
                  />

                  {!proofFile ? (
                    <div
                      className="proof-upload-box"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <div className="proof-upload-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </div>
                      <div className="proof-upload-prompt">
                        Click to upload proof (PDF, JPG, PNG, max 5 MB)
                      </div>
                    </div>
                  ) : (
                    <div className="proof-selected-card">
                      <div className="proof-selected-info">
                        <span className="proof-selected-name" title={proofFile.name}>
                          {proofFile.name}
                        </span>
                        <span className="proof-selected-size">
                          {formatFileSize(proofFile.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="proof-remove-btn"
                        onClick={handleRemoveProof}
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <div style={{ color: "var(--danger)", fontSize: "0.82rem", marginTop: 6 }}>
                      {fileError}
                    </div>
                  )}

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
              disabled={isSubmitDisabled}
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


