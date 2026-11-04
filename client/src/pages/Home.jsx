// Home.jsx - Real home page with Hero, Search, Upcoming Drives, Latest Experiences, How It Works, and Footer

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/home.css";

const formatPackageRange = (min, max) => {
  if (min !== undefined && max !== undefined && min !== null && max !== null) {
    if (min === max) return `${min} LPA`;
    return `${min} - ${max} LPA`;
  }
  if (min !== undefined && min !== null) return `From ${min} LPA`;
  if (max !== undefined && max !== null) return `Up to ${max} LPA`;
  return "Package not disclosed";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Date TBA";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  // Upcoming drives
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [drivesError, setDrivesError] = useState("");

  // Latest experiences
  const [experiences, setExperiences] = useState([]);
  const [loadingExps, setLoadingExps] = useState(true);
  const [expsError, setExpsError] = useState("");

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/companies");
    }
  };

  // Fetch upcoming drives
  useEffect(() => {
    let isMounted = true;
    const fetchDrives = async () => {
      setLoadingDrives(true);
      try {
        const res = await api.get("/companies?isUpcoming=true");
        if (isMounted) {
          const list = res.data?.data || [];
          setDrives(list.slice(0, 4));
        }
      } catch (err) {
        if (isMounted) {
          setDrivesError(err.response?.data?.message || "Failed to load upcoming drives.");
        }
      } finally {
        if (isMounted) setLoadingDrives(false);
      }
    };
    fetchDrives();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch latest experiences
  useEffect(() => {
    let isMounted = true;
    const fetchExperiences = async () => {
      setLoadingExps(true);
      try {
        const res = await api.get("/experiences?sort=latest");
        if (isMounted) {
          const list = res.data?.data || [];
          setExperiences(list.slice(0, 4));
        }
      } catch (err) {
        if (isMounted) {
          setExpsError(err.response?.data?.message || "Failed to load experiences.");
        }
      } finally {
        if (isMounted) setLoadingExps(false);
      }
    };
    fetchExperiences();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-container">
      {/* ── Hero Section ── */}
      <section className="home-hero">
        <h1 className="home-hero-title">Crack Your Campus Placements</h1>
        <p className="home-hero-desc">
          Verified placement experiences, interview round breakdowns, and senior advice for top companies.
        </p>

        <div className="home-hero-actions">
          <Link to="/companies" className="btn btn-primary">
            Browse Companies
          </Link>
          {!isAuthenticated && (
            <Link to="/signup" className="btn btn-outline">
              Sign up
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="home-search-form">
          <input
            type="text"
            className="home-search-input"
            placeholder="Search company by name (e.g. Google, Amazon, TCS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 20px" }}>
            Search
          </button>
        </form>
      </section>

      {/* ── Upcoming Drives ── */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Upcoming Placement Drives</h2>
          <Link to="/companies" className="home-section-link">
            View All Companies &rarr;
          </Link>
        </div>

        {loadingDrives ? (
          <Spinner message="Loading upcoming drives..." />
        ) : drivesError ? (
          <div className="form-error">{drivesError}</div>
        ) : drives.length === 0 ? (
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
            No upcoming drives scheduled right now. Check back soon!
          </div>
        ) : (
          <div className="home-drives-grid">
            {drives.map((company) => (
              <Link
                key={company._id}
                to={`/companies/${company._id}`}
                className="home-drive-card"
              >
                <div className="home-drive-name">{company.name}</div>
                <div className="home-drive-pkg">
                  {formatPackageRange(company.packageMin, company.packageMax)}
                </div>
                <div className="home-drive-date">
                  📅 {formatDate(company.nextDriveDate)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Latest Experiences ── */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Latest Interview Experiences</h2>
          <Link to="/companies" className="home-section-link">
            Explore All &rarr;
          </Link>
        </div>

        {loadingExps ? (
          <Spinner message="Loading latest experiences..." />
        ) : expsError ? (
          <div className="form-error">{expsError}</div>
        ) : experiences.length === 0 ? (
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
            No experiences shared yet.
          </div>
        ) : (
          <div className="home-exp-grid">
            {experiences.map((exp) => (
              <Link
                key={exp._id}
                to={`/experiences/${exp._id}`}
                className="home-exp-card"
              >
                <div>
                  <div className="home-exp-company">{exp.company?.name || "Company"}</div>
                  <div className="home-exp-role">
                    {exp.role} &bull; {exp.year}
                  </div>
                </div>
                <div className="home-exp-footer">
                  {exp.result && (
                    <span className={getResultBadgeClass(exp.result)}>
                      {exp.result}
                    </span>
                  )}
                  <span style={{ fontWeight: 600, color: "var(--navy)" }}>
                    ▲ {exp.upvotes?.length || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">How It Works</h2>
        </div>

        <div className="home-steps-grid">
          <div className="home-step-card">
            <div className="home-step-num">01</div>
            <h3 className="home-step-title">Find your company</h3>
            <p className="home-step-desc">
              Browse companies visiting your campus, their eligibility criteria, cutoffs, and hiring roles.
            </p>
          </div>

          <div className="home-step-card">
            <div className="home-step-num">02</div>
            <h3 className="home-step-title">Read senior experiences</h3>
            <p className="home-step-desc">
              Gain verified insights into actual interview rounds, question topics, preparation tips, and pitfalls.
            </p>
          </div>

          <div className="home-step-card">
            <div className="home-step-num">03</div>
            <h3 className="home-step-title">Ask and prepare</h3>
            <p className="home-step-desc">
              Get your doubts answered directly by placed seniors who cracked the interview process.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer Strip ── */}
      <footer className="home-footer-strip">
        <div className="home-footer-brand">Placely</div>
        <div>Your campus placement companion &bull; Built for students, powered by seniors.</div>
      </footer>
    </div>
  );
};

export default Home;
