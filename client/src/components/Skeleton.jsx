// Skeleton.jsx - Flexible shimmering placeholder loading UI

import React from "react";
import "../styles/skeleton.css";

export const Skeleton = ({ width, height, borderRadius, style = {}, className = "" }) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width: width || "100%",
        height: height || "20px",
        borderRadius: borderRadius || "var(--radius)",
        ...style,
      }}
    />
  );
};

export const CompanyCardSkeleton = () => {
  return (
    <div className="card company-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <Skeleton width="60%" height="24px" />
        <Skeleton width="25%" height="20px" borderRadius="999px" />
      </div>
      <Skeleton width="100%" height="16px" style={{ marginBottom: "8px" }} />
      <Skeleton width="80%" height="16px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <Skeleton height="48px" />
        <Skeleton height="48px" />
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <Skeleton width="60px" height="20px" borderRadius="999px" />
        <Skeleton width="70px" height="20px" borderRadius="999px" />
      </div>
    </div>
  );
};

export const ExperienceCardSkeleton = () => {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <Skeleton width="45%" height="22px" />
        <Skeleton width="20%" height="22px" borderRadius="999px" />
      </div>
      <Skeleton width="30%" height="16px" style={{ marginBottom: "12px" }} />
      <Skeleton width="100%" height="16px" style={{ marginBottom: "8px" }} />
      <Skeleton width="75%" height="16px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton width="100px" height="18px" />
        <Skeleton width="80px" height="18px" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton width="70%" height="14px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <Skeleton width={c === 0 ? "85%" : "60%"} height="16px" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Skeleton;

