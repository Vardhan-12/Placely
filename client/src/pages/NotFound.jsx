// NotFound.jsx - 404 page for unknown routes

import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="container" style={{ padding: "64px 16px", textAlign: "center" }}>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: "3.5rem", color: "var(--navy)", marginBottom: 8 }}>404</h1>
        <h2 style={{ fontSize: "1.25rem", marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: "0.95rem" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

