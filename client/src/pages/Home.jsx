// Home.jsx - Placeholder landing hero for Placely

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container" style={{ padding: "64px 16px" }}>
      <section
        className="card"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "56px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <span className="badge badge-blue">Campus Placement Community</span>
        </div>
        <h1 style={{ marginBottom: 16 }}>
          Learn directly from seniors who cracked placements.
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--muted)",
            maxWidth: 620,
            margin: "0 auto 32px",
          }}
        >
          Explore verified interview experiences, cutoffs, round breakdowns, and direct campus Q&A.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link to="/companies" className="btn btn-primary" style={{ padding: "12px 24px" }}>
            Browse Companies
          </Link>
          {!isAuthenticated && (
            <Link to="/signup" className="btn btn-outline" style={{ padding: "12px 24px" }}>
              Sign up
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

