// AuthBrandPanel.jsx — Shared left panel for Login and Signup
// Zones (top→bottom, nothing overlaps):
//   1. Logo + pill
//   2. Headline + sub
//   3. SVG journey (path draw, dot + comet, node light-up, Selected pill)
//   4. Latest debriefs ticker (real data, hides if unavailable)
//   5. Stat row (count-up)
// Props: companyCount, experienceCount, questionCount, experiences (array)

import React, { useEffect, useRef, useState, useCallback } from "react";

/* ─── Count-up hook ───────────────────────────────────────────────────────── */
function useCountUp(target, durationMs = 1100) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const t0  = useRef(null);

  useEffect(() => {
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target); return;
    }
    t0.current = null;
    const run = (ts) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / durationMs, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, durationMs]);

  return val;
}

/* ─── SVG constants ───────────────────────────────────────────────────────── */
// ViewBox 520 × 200. Four evenly spaced stations on a gentle S-curve.
// Stations at x = 60, 180, 340, 460; y alternates 100 → 60 → 140 → 80.
const VW = 520, VH = 200;
const PATH_D =
  "M 60 100 C 100 100 140 60 180 60 C 240 60 280 140 340 140 C 390 140 420 80 460 80";
const PATH_LEN = 440; // approx length used for dasharray

const STATIONS = [
  { cx: 60,  cy: 100, label: "Online assessment" },
  { cx: 180, cy: 60,  label: "Technical round"   },
  { cx: 340, cy: 140, label: "HR round"           },
  { cx: 460, cy: 80,  label: "Offer"              },
];

// Node size 56×44 px in SVG units
const NW = 44, NH = 36;

// Loop timing (seconds):
//  0–5   path draws
//  5–13  dot travels (8 s across the path)
// 13–15  "Selected" badge held
// 15     reset
const LOOP = 15;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function AuthBrandPanel({
  companyCount    = 0,
  experienceCount = 0,
  questionCount   = 0,
  experiences     = [],   // array of {company:{name}, role, result} from parent
}) {
  /* count-up */
  const dCompanies = useCountUp(companyCount,    900);
  const dExperts   = useCountUp(experienceCount, 1100);
  const dQA        = useCountUp(questionCount,   1300);

  /* ticker state */
  const [tickIdx, setTickIdx] = useState(0);
  const [tickVisible, setTickVisible] = useState(true);
  const tickItems = experiences.slice(0, 10); // up to 10 real items

  useEffect(() => {
    if (tickItems.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setTickVisible(false);
      setTimeout(() => {
        setTickIdx(i => (i + 1) % tickItems.length);
        setTickVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(id);
  }, [tickItems.length]);

  const tick = tickItems[tickIdx];

  return (
    <div className="auth-brand-side">
      {/* faint grid (purely decorative) */}
      <div className="auth-bg-grid" aria-hidden="true" />

      {/* ── Zone 1: logo + pill ── */}
      <div className="abp-logo-row">
        <span className="abp-logo">Placely<span className="abp-dot">.</span></span>
        <span className="abp-pill">Placement portal</span>
      </div>

      {/* ── Zone 2: headline ── */}
      <div className="abp-headline-zone">
        <h1 className="abp-headline">
          Know what happens<br />inside the interview room.
        </h1>
        <p className="abp-sub">
          Round-by-round debriefs, compensation packages, and question topics — logged by placed seniors.
        </p>
      </div>

      {/* ── Zone 3: SVG journey ── */}
      <div className="abp-journey-zone" aria-hidden="true">
        <svg
          className="abp-svg"
          viewBox={`0 0 ${VW} ${VH}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          {/* faint guide path */}
          <path d={PATH_D} fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />

          {/* animated draw path */}
          <path
            className="journey-draw"
            d={PATH_D}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={PATH_LEN}
          />

          {/* stations */}
          {STATIONS.map((s, i) => (
            <g key={i} className={`jstation js-${i}`}>
              {/* ripple ring */}
              <rect
                x={s.cx - NW/2 - 6} y={s.cy - NH/2 - 6}
                width={NW + 12}      height={NH + 12}
                rx="10"
                className="jripple"
              />
              {/* node body */}
              <rect
                x={s.cx - NW/2} y={s.cy - NH/2}
                width={NW}      height={NH}
                rx="7"
                className="jnode-rect"
              />
              {/* check icon (hidden until lit) */}
              <text
                x={s.cx} y={s.cy + 5}
                textAnchor="middle"
                className="jnode-check"
                fontSize="14"
                fontWeight="800"
              >✓</text>
              {/* label */}
              <text
                x={s.cx} y={s.cy + NH/2 + 16}
                textAnchor="middle"
                className="jnode-label"
                fontSize="10"
              >
                {s.label}
              </text>
            </g>
          ))}

          {/* comet trail: a gradient line just behind the dot */}
          <line className="jcomet" strokeLinecap="round" strokeWidth="3" />

          {/* travelling dot */}
          <circle className="jdot" r="6">
            <animateMotion
              dur={`${LOOP}s`}
              repeatCount="indefinite"
              begin="5s"
              calcMode="linear"
            >
              <mpath href="#abpPath" />
            </animateMotion>
          </circle>

          {/* hidden path for animateMotion */}
          <path id="abpPath" d={PATH_D} fill="none" />

          {/* "Selected" badge at last station */}
          <g
            className="jselected-badge"
            transform={`translate(${STATIONS[3].cx}, ${STATIONS[3].cy - NH/2 - 18})`}
          >
            <rect x="-30" y="-13" width="60" height="22" rx="11" className="jbadge-rect" />
            <text
              textAnchor="middle" y="4"
              className="jbadge-text"
              fontSize="10" fontWeight="700"
            >
              Selected
            </text>
          </g>
        </svg>
      </div>

      {/* ── Zone 4: latest debriefs ticker ── */}
      {tickItems.length > 1 && (
        <div className="abp-ticker-zone">
          <span className="abp-ticker-label">Latest debrief</span>
          <span
            className="abp-ticker-item"
            style={{ opacity: tickVisible ? 1 : 0, transform: tickVisible ? "translateY(0)" : "translateY(-6px)" }}
          >
            <span className="abp-ticker-co">{tick?.company?.name ?? tick?.company ?? "—"}</span>
            <span className="abp-ticker-sep">·</span>
            <span className="abp-ticker-role">{tick?.role ?? "—"}</span>
            <span className={`abp-ticker-result ${tick?.result === "selected" ? "sel" : "nsel"}`}>
              {tick?.result === "selected" ? "Selected" : "Not selected"}
            </span>
          </span>
        </div>
      )}

      {/* ── Zone 5: stat row ── */}
      <div className="abp-stats-row">
        <div className="abp-stat">
          <span className="abp-stat-num">{dCompanies || companyCount || 15}</span>
          <span className="abp-stat-lbl">Companies</span>
        </div>
        <div className="abp-stat-div" />
        <div className="abp-stat">
          <span className="abp-stat-num">{dExperts || experienceCount || 49}</span>
          <span className="abp-stat-lbl">Interview logs</span>
        </div>
        <div className="abp-stat-div" />
        <div className="abp-stat">
          <span className="abp-stat-num">{dQA || questionCount || 28}</span>
          <span className="abp-stat-lbl">Q&amp;A threads</span>
        </div>
      </div>
    </div>
  );
}
