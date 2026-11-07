// AdminExperiences.jsx — Moderation: list all experiences, delete with confirm
// GET /api/experiences → { success, count, data: Experience[] }
//   Each exp: { _id, company:{_id,name}, author:{name}(masked when anon),
//               isAnonymous, role, year, result, upvotes[], createdAt, … }
// DELETE /api/experiences/:id → { success, message }

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { TableSkeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const getResultBadgeClass = (result) => {
  switch (result) {
    case "selected": return "badge badge-success";
    case "rejected": return "badge badge-danger";
    case "waiting":  return "badge badge-warning";
    default:         return "badge badge-gray";
  }
};

const AdminExperiences = () => {
  const [exps, setExps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const toast                     = useToast();

  const fetchExps = useCallback(
    async ({ isBackground = false } = {}) => {
      if (!isBackground) {
        setLoading(true);
      }
      try {
        const res = await api.get("/experiences");
        setExps(res.data?.data || []);
      } catch (err) {
        if (!isBackground) {
          toast.error(err.response?.data?.message || "Failed to load experiences.");
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchExps({ isBackground: false });
  }, [fetchExps]);

  // Focus + 30s auto refresh for admin experiences table
  useAutoRefresh(fetchExps, {
    intervalMs: 30000,
  });

  const handleDelete = async (exp) => {
    const label = `${exp.role} @ ${exp.company?.name || "?"}`;
    if (!window.confirm(`Delete experience "${label}"? This cannot be undone.`)) return;
    setDeletingId(exp._id);
    try {
      const res = await api.delete(`/experiences/${exp._id}`);
      toast.success(res.data?.message || "Experience deleted.");
      await fetchExps();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Experiences</h2>
      <p className="admin-section-subtitle">
        Moderate all placement experiences. ({exps.length} total)
      </p>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : exps.length === 0 ? (
        <div className="admin-empty">No experiences posted yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Year</th>
                <th>Author</th>
                <th>Result</th>
                <th>Upvotes</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exps.map((exp) => {
                const isDeleting = deletingId === exp._id;
                const authorName = exp.isAnonymous
                  ? "Anonymous"
                  : exp.author?.name || "—";

                return (
                  <tr key={exp._id}>
                    <td style={{ fontWeight: 600 }}>
                      {exp.company?.name || "—"}
                    </td>
                    <td>{exp.role}</td>
                    <td>{exp.year}</td>
                    <td>
                      {authorName}
                      {exp.isAnonymous && (
                        <span
                          className="badge badge-gray"
                          style={{ marginLeft: 6, fontSize: "0.72rem" }}
                        >
                          anon
                        </span>
                      )}
                    </td>
                    <td>
                      {exp.result && (
                        <span className={getResultBadgeClass(exp.result)}>
                          {exp.result}
                        </span>
                      )}
                    </td>
                    <td>{exp.upvotes?.length ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link
                          to={`/experiences/${exp._id}`}
                          className="btn btn-outline"
                          style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Link>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                          disabled={isDeleting}
                          onClick={() => handleDelete(exp)}
                        >
                          {isDeleting ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminExperiences;

