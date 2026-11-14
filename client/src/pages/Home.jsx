// Home.jsx - Placement archive portal home view with live preview hero, verified drives, and real experience records

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/home.css";

const formatPackageRange = (min, max) => {
  if (min !== undefined && max !== undefined && min !== null && max !== null) {
    if (min === max) return `${min} LPA`;
    return `${min} – ${max} LPA`;
  }
  if (min !== undefined && min !== null) return `From ${min} LPA`;
  if (max !== undefined && max !== null) return `Up to ${max} LPA`;
  return "Disclosed in drive";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

  // Total counts for real stats
  const [companyCount, setCompanyCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [companyChips, setCompanyChips] = useState([]);

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/companies");
    }
  };

  // Fetch upcoming drives & company list for real chips and real count
  useEffect(() => {
    let isMounted = true;
    const fetchCompanies = async () => {
      setLoadingDrives(true);
      try {
        const [upcomingRes, allRes, qaRes] = await Promise.all([
          api.get("/companies?isUpcoming=true"),
          api.get("/companies"),
          api.get("/qa/questions"),
        ]);
        if (isMounted) {
          const upList = upcomingRes.data?.data || [];
          // Filter to only future or today drives, sorted soonest first
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const validUpcoming = upList
            .filter((c) => {
              if (!c.nextDriveDate) return false;
              const driveDate = new Date(c.nextDriveDate);
              return !isNaN(driveDate.getTime()) && driveDate >= now;
            })
            .sort((a, b) => new Date(a.nextDriveDate) - new Date(b.nextDriveDate));

          setDrives(validUpcoming.slice(0, 5));

          const allList = allRes.data?.data || [];
          setCompanyCount(allRes.data?.count ?? allList.length);
          // Pick top unique company names from real data for the search chips
          const chips = allList
            .map((c) => c.name)
            .filter(Boolean)
            .slice(0, 5);
          setCompanyChips(chips);

          const qList = qaRes.data?.data || [];
          setQuestionCount(qaRes.data?.count ?? qList.length);
        }
      } catch (err) {
        if (isMounted) {
          setDrivesError(err.response?.data?.message || "Failed to load upcoming drives.");
        }
      } finally {
        if (isMounted) setLoadingDrives(false);
      }
    };
    fetchCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch latest experiences and total count
  useEffect(() => {
    let isMounted = true;
    const fetchExperiences = async () => {
      setLoadingExps(true);
      try {
        const res = await api.get("/experiences?sort=latest");
        if (isMounted) {
          const list = res.data?.data || [];
          setExperiences(list.slice(0, 6));
          setExperienceCount(res.data?.count ?? list.length);
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

  // Use the first real experience for the live preview if available, else clean fallback
  const previewExp = experiences[0];
  const previewCompanyName = previewExp?.company?.name || drives[0]?.name || "Campus Placement";
  const previewRole = previewExp?.role || "Software Engineer";
  const previewYear = previewExp?.year || new Date().getFullYear();
  const previewPkg = previewExp?.packageLPA ? `${previewExp.packageLPA} LPA` : (drives[0]?.packageMax ? `${drives[0].packageMax} LPA` : "14.5 LPA");

  return (
    <div className="home-wrapper">
      {/* ── BOLD HERO (Two Column, Technical Blueprint Slate #0E1726) ── */}
      <section className="home-hero-band">
        <div className="container home-hero-inner">
          {/* Left Column: Mission, Search, Company Chips */}
          <div className="home-hero-left">
            <div className="home-hero-kicker">
              <span className="home-kicker-dot"></span>
              LPU Interview Archive & Placement Logs
            </div>

            <h1 className="home-hero-heading">
              Know what happens inside the interview room.
            </h1>

            <p className="home-hero-subhead">
              Round-by-round interview debriefs, compensation packages, and question topics logged directly by placed seniors.
            </p>

            <form onSubmit={handleSearch} className="home-search-bar">
              <span className="home-search-bar-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                className="home-search-bar-input"
                placeholder="Search company or role (e.g. Amazon, Google, SDE)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="home-search-bar-btn">
                Search
              </button>
            </form>

            {companyChips.length > 0 && (
              <div className="home-search-chips">
                <span className="home-chips-label">On Campus:</span>
                {companyChips.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="home-chip"
                    onClick={() => navigate(`/companies?search=${encodeURIComponent(name)}`)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div className="home-hero-cta-row">
              <Link to="/companies" className="btn btn-primary">
                Explore Company Directory &rarr;
              </Link>
              {!isAuthenticated && (
                <Link to="/signup" className="btn btn-outline-white">
                  Join as Student
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Live Product Preview (Interactive Round Timeline) */}
          <div className="home-hero-right">
            <div className="home-preview-card">
              <div className="home-preview-chrome">
                <div className="home-preview-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="home-preview-badge">
                  {previewExp ? "Live Record Preview" : "Sample Record"}
                </div>
                <div className="home-preview-year">{previewYear}</div>
              </div>

              <div className="home-preview-head">
                <div>
                  <h3 className="home-preview-title">{previewCompanyName}</h3>
                  <div className="home-preview-meta">
                    <span>{previewRole}</span>
                    <span className="home-preview-dot">&bull;</span>
                    <span className="home-preview-pkg">{previewPkg}</span>
                  </div>
                </div>
                <div className="home-stamp home-stamp-selected">Selected</div>
              </div>

              {/* Vertical Interview Timeline Preview */}
              <div className="home-preview-timeline">
                <div className="home-timeline-item">
                  <div className="home-timeline-marker">1</div>
                  <div className="home-timeline-content">
                    <div className="home-timeline-header">
                      <span className="home-timeline-name">Online Assessment</span>
                      <span className="home-timeline-time">90 mins</span>
                    </div>
                    <div className="home-timeline-tags">
                      <span className="home-tag">DSA (Arrays, Graphs)</span>
                      <span className="home-tag">CS Core & Aptitude</span>
                    </div>
                  </div>
                </div>

                <div className="home-timeline-item">
                  <div className="home-timeline-marker">2</div>
                  <div className="home-timeline-content">
                    <div className="home-timeline-header">
                      <span className="home-timeline-name">Technical Interview</span>
                      <span className="home-timeline-time">45 mins</span>
                    </div>
                    <div className="home-timeline-tags">
                      <span className="home-tag">Live Coding</span>
                      <span className="home-tag">System Design / DBMS</span>
                    </div>
                  </div>
                </div>

                <div className="home-timeline-item">
                  <div className="home-timeline-marker">3</div>
                  <div className="home-timeline-content">
                    <div className="home-timeline-header">
                      <span className="home-timeline-name">Managerial & HR</span>
                      <span className="home-timeline-time">30 mins</span>
                    </div>
                    <div className="home-timeline-tags">
                      <span className="home-tag">Project Deep-dive</span>
                      <span className="home-tag">Behavioral</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="home-preview-foot">
                <span className="home-preview-caption">
                  {previewExp ? `Posted by placed senior in ${previewCompanyName}` : "Standard 3-round campus hiring workflow"}
                </span>
                <span className="home-preview-link">
                  {previewExp ? (
                    <Link to={`/experiences/${previewExp._id}`}>Read Full Debrief &rarr;</Link>
                  ) : (
                    <span>Verified Log</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REAL METRICS STRIP (Counts from actual Database) ── */}
      <section className="home-stats-strip">
        <div className="container home-stats-inner">
          <div className="home-stat-unit">
            <span className="home-stat-num">{companyCount}</span>
            <span className="home-stat-label">Companies Tracked</span>
          </div>
          <div className="home-stat-divider" aria-hidden="true"></div>

          <div className="home-stat-unit">
            <span className="home-stat-num">{experienceCount}</span>
            <span className="home-stat-label">Interview Debriefs</span>
          </div>
          <div className="home-stat-divider" aria-hidden="true"></div>

          <div className="home-stat-unit">
            <span className="home-stat-num">{drives.length}</span>
            <span className="home-stat-label">Active Campus Drives</span>
          </div>
          <div className="home-stat-divider" aria-hidden="true"></div>

          <div className="home-stat-unit">
            <span className="home-stat-num">{questionCount}</span>
            <span className="home-stat-label">Q&A Questions</span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="container home-body-container">
        {/* ── UPCOMING DRIVES (Compact Table-like Ledger) ── */}
        <section className="home-content-section">
          <div className="home-section-heading-row">
            <div>
              <h2 className="home-content-title">Upcoming Campus Drives</h2>
              <p className="home-content-sub">Schedules and package cutoffs for ongoing placement visits</p>
            </div>
            <Link to="/companies?isUpcoming=true" className="home-section-action-link">
              View all upcoming companies &rarr;
            </Link>
          </div>

          {loadingDrives ? (
            <Spinner message="Checking placement drive schedules..." />
          ) : drivesError ? (
            <div className="form-error">{drivesError}</div>
          ) : drives.length === 0 ? (
            <div className="home-empty-notice">
              No upcoming drives scheduled in the database right now.
            </div>
          ) : (
            <div className="home-table-ledger">
              <div className="home-table-ledger-head">
                <span className="col-date">Date</span>
                <span className="col-company">Company</span>
                <span className="col-roles">Roles Visiting</span>
                <span className="col-pkg">Package</span>
                <span className="col-action"></span>
              </div>
              <div className="home-table-ledger-body">
                {drives.map((c) => (
                  <Link
                    key={c._id}
                    to={`/companies/${c._id}`}
                    className="home-ledger-row"
                  >
                    <div className="home-ledger-topline">
                      <span className="col-date">
                        <span className="home-date-stamp">{formatDate(c.nextDriveDate)}</span>
                      </span>
                      <span className="col-pkg">
                        <span className="home-pkg-badge">
                          {formatPackageRange(c.packageMin, c.packageMax)}
                        </span>
                      </span>
                    </div>
                    <span className="col-company">
                      <strong className="home-ledger-comp-name">{c.name}</strong>
                    </span>
                    <span className="col-roles">
                      {c.roles && c.roles.length > 0
                        ? c.roles.slice(0, 2).join(", ") + (c.roles.length > 2 ? ` +${c.roles.length - 2}` : "")
                        : "Campus Hire"}
                    </span>
                    <span className="col-action">
                      <span className="home-arrow-btn">&rarr;</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── LATEST INTERVIEW EXPERIENCES (Result-Stamped Record List) ── */}
        <section className="home-content-section">
          <div className="home-section-heading-row">
            <div>
              <h2 className="home-content-title">Latest Interview Experiences</h2>
              <p className="home-content-sub">Recent placement logs submitted by seniors</p>
            </div>
            <Link to="/companies" className="home-section-action-link">
              Explore full experience archive &rarr;
            </Link>
          </div>

          {loadingExps ? (
            <Spinner message="Loading interview logs..." />
          ) : expsError ? (
            <div className="form-error">{expsError}</div>
          ) : experiences.length === 0 ? (
            <div className="home-empty-notice">
              No interview experiences shared yet.
            </div>
          ) : (
            <div className="home-exp-ledger">
              {experiences.map((exp) => {
                const isSelected = exp.result === "selected";
                const isRejected = exp.result === "rejected";
                const stampClass = isSelected
                  ? "home-stamp-selected"
                  : isRejected
                  ? "home-stamp-rejected"
                  : "home-stamp-waiting";

                return (
                  <Link
                    key={exp._id}
                    to={`/experiences/${exp._id}`}
                    className="home-exp-record"
                  >
                    <div className="home-exp-left">
                      <span className={`home-stamp ${stampClass}`}>
                        {exp.result === "selected"
                          ? "Selected"
                          : exp.result === "rejected"
                          ? "Not Selected"
                          : "In Process"}
                      </span>
                      <div className="home-exp-meta-group">
                        <div className="home-exp-topline">
                          <span className="home-exp-company-name">
                            {exp.company?.name || "Company"}
                          </span>
                          <span className="home-exp-role-title">
                            &bull; {exp.role}
                          </span>
                        </div>
                        <div className="home-exp-subline">
                          <span>Batch of {exp.year}</span>
                          {exp.packageLPA ? (
                            <>
                              <span>&bull;</span>
                              <span className="home-exp-sub-pkg">{exp.packageLPA} LPA</span>
                            </>
                          ) : null}
                          {exp.difficulty ? (
                            <>
                              <span>&bull;</span>
                              <span className="home-exp-diff">Rated {exp.difficulty}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="home-exp-right">
                      <span className="home-upvote-indicator" title={`${exp.upvotes?.length || 0} students found this helpful`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                        <span>{exp.upvotes?.length || 0} helpful</span>
                      </span>
                      <span className="home-arrow-btn">&rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── WHY PLACELY (Concrete, Real Pillars) ── */}
        <section className="home-content-section home-editorial-section">
          <div className="home-section-heading-row">
            <div>
              <h2 className="home-content-title">Why Placely Was Built</h2>
              <p className="home-content-sub">Campus placement transparency for students, by students</p>
            </div>
          </div>

          <div className="home-manifesto-grid">
            <div className="home-manifesto-card">
              <div className="home-manifesto-num">01 / ARCHIVE</div>
              <h3 className="home-manifesto-heading">No more hearsay in WhatsApp groups</h3>
              <p className="home-manifesto-text">
                Every interview round is recorded with actual question themes, durations, and coding environments so you walk into test centers knowing exactly what to anticipate.
              </p>
            </div>

            <div className="home-manifesto-card">
              <div className="home-manifesto-num">02 / PROOF</div>
              <h3 className="home-manifesto-heading">Senior placement proof required</h3>
              <p className="home-manifesto-text">
                Senior contributors must submit offer letters or confirmation emails that are vetted by campus administrators before their experiences or Q&A answers appear publicly.
              </p>
            </div>

            <div className="home-manifesto-card">
              <div className="home-manifesto-num">03 / TARGETED</div>
              <h3 className="home-manifesto-heading">Questions answered by those placed there</h3>
              <p className="home-manifesto-text">
                Instead of generic prep advice, juniors ask questions tagged directly to specific companies, alerting the seniors who cleared those exact interview loops.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
