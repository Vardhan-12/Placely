// EmptyState.jsx - Reusable friendly empty & error state display with icons and actions

import React from "react";

const EmptyState = ({
  icon,
  title = "No data found",
  message = "Try adjusting your filters or check back later.",
  action = null,
  isError = false,
}) => {
  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        padding: "48px 24px",
        maxWidth: 520,
        margin: "24px auto",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: isError ? "var(--badge-danger-bg)" : "var(--hover-subtle)",
          color: isError ? "var(--danger)" : "var(--muted)",
          marginBottom: 16,
          fontSize: "1.5rem",
        }}
      >
        {icon || (
          isError ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          )
        )}
      </div>
      <h3 style={{ marginBottom: 8, color: isError ? "var(--danger)" : "var(--text)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", marginBottom: action ? 20 : 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
        {message}
      </p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
