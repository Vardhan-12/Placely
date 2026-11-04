// Companies.jsx - Public companies directory with search, filter, and sorting

import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import "../styles/companies.css";

// Helper: Format package range nicely
const formatPackageRange = (min, max) => {
  if (min !== undefined && max !== undefined && min !== null && max !== null) {
    if (min === max) return `${min} LPA`;
    return `${min} - ${max} LPA`;
  }
  if (min !== undefined && min !== null) return `From ${min} LPA`;
  if (max !== undefined && max !== null) return `Up to ${max} LPA`;
  return "Not disclosed";
};

const Companies = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter & Search states
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isUpcomingOnly, setIsUpcomingOnly] = useState(false);
  const [sortBy, setSortBy] = useState("latest");

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch companies whenever filters or search query change
  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }
        if (isUpcomingOnly) {
          params.isUpcoming = "true";
        }
        if (sortBy) {
          params.sort = sortBy;
        }

        const res = await api.get("/companies", { params });
        if (isMounted) {
          setCompanies(res.data?.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load companies");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, isUpcomingOnly, sortBy]);

  return (
    <div className="container" style={{ padding: "36px 16px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 6 }}>Companies Directory</h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem" }}>
          Discover hiring partners, interview rounds, and eligibility criteria.
        </p>
      </div>

      {/* Toolbar: Search, Upcoming Filter, Sort Dropdown */}
      <div className="companies-toolbar">
        <div className="companies-search-wrap">
          <input
            type="text"
            className="input"
            placeholder="Search companies by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="companies-filters-wrap">
          <label className="filter-checkbox-label">
            <input
              type="checkbox"
              checked={isUpcomingOnly}
              onChange={(e) => setIsUpcomingOnly(e.target.checked)}
            />
            Upcoming drives only
          </label>

          <div className="sort-select-wrap">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">Latest</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Rendering: Loading, Error, Empty, or Cards Grid */}
      {loading ? (
        <Spinner message="Loading companies..." />
      ) : error ? (
        <div className="alert-warning" style={{ textAlign: "center", margin: "24px 0" }}>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 12 }}
            onClick={() => setDebouncedSearch((s) => s + " ")}
          >
            Try Again
          </button>
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          title="No companies found"
          message={
            debouncedSearch || isUpcomingOnly
              ? "No companies match your current search or filter criteria. Try clearing them."
              : "No companies have been added to the platform yet."
          }
          action={
            (debouncedSearch || isUpcomingOnly) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSearch("");
                  setIsUpcomingOnly(false);
                }}
              >
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <div className="companies-grid">
          {companies.map((company) => (
            <div key={company._id} className="card company-card">
              <div>
                <div className="company-card-header">
                  <h3 className="company-card-title">{company.name}</h3>
                  {company.isUpcoming && (
                    <span className="badge badge-cyan">Upcoming</span>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="company-metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Package</span>
                    <span className="metric-value">
                      {formatPackageRange(company.packageMin, company.packageMax)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">CGPA Cutoff</span>
                    <span className="metric-value">
                      {company.cgpaCutoff !== undefined && company.cgpaCutoff !== null
                        ? `${company.cgpaCutoff}+`
                        : "None"}
                    </span>
                  </div>
                </div>

                {/* Roles Badges */}
                {company.roles && company.roles.length > 0 && (
                  <div className="company-roles-list">
                    {company.roles.map((role, idx) => (
                      <span key={idx} className="badge badge-gray">
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View Company Button */}
              <div style={{ marginTop: 16 }}>
                <Link
                  to={`/companies/${company._id}`}
                  className="btn btn-outline btn-block"
                >
                  View Company
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;

