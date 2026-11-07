// AdminCompanies.jsx — Company CRUD
// GET /api/companies  → { success, count, data: Company[] }
// POST /api/companies → { success, data: Company }
// PUT  /api/companies/:id → { success, data: Company }
// DELETE /api/companies/:id → { success, message }
//
// Company shape: { _id, name, description, roles[], packageMin, packageMax,
//   cgpaCutoff, rounds[{_id?,name,type,description}], isUpcoming, nextDriveDate, createdAt }
// Round type enum: aptitude | coding | technical | hr | other  (name required, type required)

import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { TableSkeleton } from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const ROUND_TYPES = ["aptitude", "coding", "technical", "hr", "other"];

const emptyRound = () => ({ name: "", type: "coding", description: "" });

const emptyForm = () => ({
  name: "",
  description: "",
  rolesInput: "",       // comma-separated string → roles[]
  packageMin: "",
  packageMax: "",
  cgpaCutoff: "",
  isUpcoming: false,
  nextDriveDate: "",
  rounds: [],
});

const formFromCompany = (c) => ({
  name: c.name || "",
  description: c.description || "",
  rolesInput: (c.roles || []).join(", "),
  packageMin: c.packageMin !== undefined ? String(c.packageMin) : "",
  packageMax: c.packageMax !== undefined ? String(c.packageMax) : "",
  cgpaCutoff: c.cgpaCutoff !== undefined ? String(c.cgpaCutoff) : "",
  isUpcoming: Boolean(c.isUpcoming),
  nextDriveDate: c.nextDriveDate ? c.nextDriveDate.slice(0, 10) : "",
  rounds: (c.rounds || []).map((r) => ({
    name: r.name || "",
    type: r.type || "coding",
    description: r.description || "",
  })),
});

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const toast                     = useToast();

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // company object or null = create
  const [form, setForm]               = useState(emptyForm());
  const [formError, setFormError]     = useState("");
  const [submitting, setSubmitting]   = useState(false);

  // Deletion
  const [deletingId, setDeletingId] = useState(null);

  const fetchCompanies = useCallback(
    async ({ isBackground = false } = {}) => {
      if (!isBackground) {
        setLoading(true);
      }
      try {
        const res = await api.get("/companies?sort=name");
        setCompanies(res.data?.data || []);
      } catch (err) {
        if (!isBackground) {
          toast.error(err.response?.data?.message || "Failed to load companies.");
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
    fetchCompanies({ isBackground: false });
  }, [fetchCompanies]);

  // Focus + 30s auto refresh for admin companies table
  useAutoRefresh(fetchCompanies, {
    intervalMs: 30000,
  });

  // ── Open modal ──────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (company) => {
    setEditTarget(company);
    setForm(formFromCompany(company));
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setFormError("");
  };

  // ── Form field helpers ──────────────────────────
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addRound = () => setForm((f) => ({ ...f, rounds: [...f.rounds, emptyRound()] }));

  const removeRound = (idx) =>
    setForm((f) => ({ ...f, rounds: f.rounds.filter((_, i) => i !== idx) }));

  const setRoundField = (idx, key, value) =>
    setForm((f) => {
      const rounds = [...f.rounds];
      rounds[idx] = { ...rounds[idx], [key]: value };
      return { ...f, rounds };
    });

  // ── Submit ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Client-side validation
    if (!form.name.trim()) {
      setFormError("Company name is required.");
      return;
    }
    const pMin = form.packageMin !== "" ? Number(form.packageMin) : undefined;
    const pMax = form.packageMax !== "" ? Number(form.packageMax) : undefined;
    if (pMin !== undefined && pMax !== undefined && pMax < pMin) {
      setFormError("Package Max must not be less than Package Min.");
      return;
    }
    for (const [i, r] of form.rounds.entries()) {
      if (!r.name.trim()) {
        setFormError(`Round ${i + 1}: name is required.`);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      roles: form.rolesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      packageMin: pMin,
      packageMax: pMax,
      cgpaCutoff: form.cgpaCutoff !== "" ? Number(form.cgpaCutoff) : undefined,
      isUpcoming: form.isUpcoming,
      nextDriveDate: form.nextDriveDate || undefined,
      rounds: form.rounds.map((r) => ({
        name: r.name.trim(),
        type: r.type,
        description: r.description.trim() || undefined,
      })),
    };

    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/companies/${editTarget._id}`, payload);
        toast.success("Company updated.");
      } else {
        await api.post("/companies", payload);
        toast.success("Company created.");
      }
      closeModal();
      await fetchCompanies();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save company.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────
  const handleDelete = async (company) => {
    if (!window.confirm(`Delete "${company.name}"? This cannot be undone.`)) return;
    setDeletingId(company._id);
    try {
      const res = await api.delete(`/companies/${company._id}`);
      toast.success(res.data?.message || "Company deleted.");
      await fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete company.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="admin-action-row">
        <div>
          <h2 className="admin-section-title">Companies</h2>
          <p className="admin-section-subtitle" style={{ marginBottom: 0 }}>
            Manage placement companies.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Company
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : companies.length === 0 ? (
        <div className="admin-empty">No companies yet. Add one above.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roles</th>
                <th>Package (LPA)</th>
                <th>CGPA</th>
                <th>Upcoming</th>
                <th>Rounds</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const isDeleting = deletingId === c._id;
                return (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: "var(--muted)", maxWidth: 180 }}>
                      {c.roles?.length ? c.roles.join(", ") : "—"}
                    </td>
                    <td>
                      {c.packageMin !== undefined || c.packageMax !== undefined
                        ? `${c.packageMin ?? "?"}–${c.packageMax ?? "?"}`
                        : "—"}
                    </td>
                    <td>{c.cgpaCutoff !== undefined ? c.cgpaCutoff : "—"}</td>
                    <td>
                      <span
                        className={`badge ${c.isUpcoming ? "badge-warning" : "badge-gray"}`}
                      >
                        {c.isUpcoming ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>{c.rounds?.length ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                          disabled={isDeleting}
                          onClick={() => handleDelete(c)}
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

      {/* ── Company modal ── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="admin-modal">
            <button className="admin-modal-close" onClick={closeModal}>✕</button>
            <h3 className="admin-modal-title">
              {editTarget ? `Edit — ${editTarget.name}` : "Add Company"}
            </h3>

            {formError && (
              <div className="admin-toast admin-toast-error" style={{ marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="admin-form-group">
                <label htmlFor="co-name">Company Name *</label>
                <input
                  id="co-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="admin-form-group">
                <label htmlFor="co-desc">Description</label>
                <textarea
                  id="co-desc"
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>

              {/* Roles */}
              <div className="admin-form-group">
                <label htmlFor="co-roles">Roles (comma-separated)</label>
                <input
                  id="co-roles"
                  className="input"
                  placeholder="e.g. SDE, Analyst, Consultant"
                  value={form.rolesInput}
                  onChange={(e) => setField("rolesInput", e.target.value)}
                />
              </div>

              {/* Package + CGPA */}
              <div className="admin-form-grid-3">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="co-pmin">Package Min (LPA)</label>
                  <input
                    id="co-pmin"
                    type="number"
                    min="0"
                    step="0.1"
                    className="input"
                    value={form.packageMin}
                    onChange={(e) => setField("packageMin", e.target.value)}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="co-pmax">Package Max (LPA)</label>
                  <input
                    id="co-pmax"
                    type="number"
                    min="0"
                    step="0.1"
                    className="input"
                    value={form.packageMax}
                    onChange={(e) => setField("packageMax", e.target.value)}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="co-cgpa">CGPA Cutoff</label>
                  <input
                    id="co-cgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="input"
                    value={form.cgpaCutoff}
                    onChange={(e) => setField("cgpaCutoff", e.target.value)}
                  />
                </div>
              </div>

              {/* Upcoming + Drive date */}
              <div className="admin-form-grid-2" style={{ marginTop: 14 }}>
                <div className="admin-form-group" style={{ marginBottom: 0, justifyContent: "center", paddingTop: 24 }}>
                  <label className="admin-checkbox-row">
                    <input
                      type="checkbox"
                      checked={form.isUpcoming}
                      onChange={(e) => setField("isUpcoming", e.target.checked)}
                    />
                    Is Upcoming Drive
                  </label>
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="co-date">Next Drive Date</label>
                  <input
                    id="co-date"
                    type="date"
                    className="input"
                    value={form.nextDriveDate}
                    onChange={(e) => setField("nextDriveDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Rounds */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <label style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                    Interview Rounds ({form.rounds.length})
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline admin-rounds-add"
                    style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                    onClick={addRound}
                  >
                    + Add Round
                  </button>
                </div>

                {form.rounds.map((round, idx) => (
                  <div key={idx} className="admin-round-card">
                    <div className="admin-round-top">
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--navy)" }}>
                        Round {idx + 1}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: "2px 10px", fontSize: "0.78rem", color: "var(--danger)" }}
                        onClick={() => removeRound(idx)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="admin-form-grid-2">
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label>Round Name *</label>
                        <input
                          className="input"
                          placeholder="e.g. Online Assessment"
                          value={round.name}
                          onChange={(e) => setRoundField(idx, "name", e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label>Type *</label>
                        <select
                          className="input"
                          value={round.type}
                          onChange={(e) => setRoundField(idx, "type", e.target.value)}
                        >
                          {ROUND_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0, marginTop: 8 }}>
                      <label>Description</label>
                      <input
                        className="input"
                        placeholder="Optional description"
                        value={round.description}
                        onChange={(e) => setRoundField(idx, "description", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : editTarget ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompanies;

