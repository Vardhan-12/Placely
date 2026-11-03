// EmptyState.jsx - Reusable empty state display

import React from "react";

const EmptyState = ({
  title = "No data found",
  message = "Try adjusting your filters or check back later.",
  action = null,
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
      <h3 style={{ marginBottom: 8, color: "var(--navy)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", marginBottom: action ? 20 : 0, fontSize: "0.95rem" }}>
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

