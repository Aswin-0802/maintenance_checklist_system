import { useEffect, useMemo, useState } from "react";
import api from "../api";

function isToday(value) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function completionStats(submission) {
  const items = submission?.template?.items || [];
  const responses = submission?.items || [];
  const map = new Map(responses.map((r) => [r.templateItemId, r]));
  let done = 0;
  let mandatoryMissing = 0;
  for (const item of items) {
    const r = map.get(item.id);
    const completed = r?.completed === true;
    if (completed) done += 1;
    if (item.isMandatory && !completed) mandatoryMissing += 1;
  }
  const total = items.length || 1;
  return {
    done,
    total: items.length,
    percent: Math.round((done / total) * 100),
    mandatoryMissing,
  };
}

function StatusPill({ status }) {
  const map = {
    submitted: { label: "Submitted", cls: "pill pill-indigo" },
    approved: { label: "Approved", cls: "pill pill-green" },
    rejected: { label: "Rejected", cls: "pill pill-red" },
    draft: { label: "Draft", cls: "pill pill-gray" },
  };
  const meta = map[status] || { label: status, cls: "pill pill-gray" };
  return <span className={meta.cls}>{meta.label}</span>;
}

export default function SupervisorPage({ auth, onLogout }) {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [decisionMode, setDecisionMode] = useState(null);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStation, setFilterStation] = useState("all");
  const [search, setSearch] = useState("");

  const welcome = useMemo(
    () => `${auth.user.name} · supervisor`,
    [auth.user.name]
  );

  async function loadData() {
    setError("");
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get("/supervisor/submissions?status=submitted"),
        api.get("/supervisor/history"),
      ]);
      setPending(pendingRes.data.data || []);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load supervisor data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const stations = useMemo(() => {
    const set = new Map();
    [...pending, ...history].forEach((s) => {
      if (s.station) set.set(s.station.id, s.station);
    });
    return Array.from(set.values());
  }, [pending, history]);

  const kpis = useMemo(() => {
    const approvedToday = history.filter(
      (h) => h.status === "approved" && isToday(h.verifiedAt || h.submittedAt)
    ).length;
    const rejectedToday = history.filter(
      (h) => h.status === "rejected" && isToday(h.verifiedAt || h.submittedAt)
    ).length;
    return {
      awaiting: pending.length,
      approvedToday,
      rejectedToday,
      total: history.length,
    };
  }, [pending, history]);

  const filteredHistory = useMemo(() => {
    return history.filter((row) => {
      if (filterStatus !== "all" && row.status !== filterStatus) return false;
      if (filterStation !== "all" && String(row.station?.id) !== filterStation) return false;
      if (search) {
        const t = search.toLowerCase();
        const hay = `${row.station?.name || ""} ${row.shift?.name || ""} ${row.staff?.name || ""}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [history, filterStatus, filterStation, search]);

  function openSubmission(row) {
    setSelected(row);
    setComment("");
    setReason("");
    setDecisionMode(null);
  }

  function closeDrawer() {
    setSelected(null);
    setDecisionMode(null);
    setComment("");
    setReason("");
  }

  async function handleApprove() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/supervisor/submissions/${selected.id}/approve`, {
        supervisorComment: comment || "Verified and approved",
      });
      showToast("Submission approved.");
      closeDrawer();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Approve failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/supervisor/submissions/${selected.id}/reject`, {
        supervisorComment: comment || "Rejected",
        rejectionReason: reason,
      });
      showToast("Submission rejected.");
      closeDrawer();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Reject failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dash-brand-mark">MCS</span>
          <span className="dash-brand-name">Supervisor</span>
        </div>
        <div className="dash-user">
          <div className="dash-avatar">{auth.user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="dash-user-name">{auth.user.name}</div>
            <div className="dash-user-role">{welcome}</div>
          </div>
        </div>
        <nav className="dash-nav">
          <button className="dash-nav-btn active">
            <span>◉</span> Verification queue
          </button>
        </nav>
        <button className="dash-logout" onClick={onLogout}>Logout</button>
      </aside>

      <section className="dash-main">
        <header className="dash-header">
          <div>
            <h1>Verification Queue</h1>
            <p className="dash-muted">Review submitted checklists and decide.</p>
          </div>
          <button className="dash-btn-outline" onClick={loadData}>Refresh</button>
        </header>

        {error && <div className="dash-alert error">{error}</div>}
        {toast && <div className="dash-toast">{toast}</div>}

        {/* KPI strip */}
        <div className="dash-kpi-grid">
          <div className="dash-kpi amber">
            <span className="dash-kpi-label">Awaiting approval</span>
            <strong>{kpis.awaiting}</strong>
            <span className="dash-kpi-hint">Submissions pending</span>
          </div>
          <div className="dash-kpi green">
            <span className="dash-kpi-label">Approved today</span>
            <strong>{kpis.approvedToday}</strong>
            <span className="dash-kpi-hint">Signed off today</span>
          </div>
          <div className="dash-kpi red">
            <span className="dash-kpi-label">Rejected today</span>
            <strong>{kpis.rejectedToday}</strong>
            <span className="dash-kpi-hint">Sent back today</span>
          </div>
          <div className="dash-kpi indigo">
            <span className="dash-kpi-label">Total history</span>
            <strong>{kpis.total}</strong>
            <span className="dash-kpi-hint">All-time records</span>
          </div>
        </div>

        {/* Pending list */}
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Pending verification</h2>
            <span className="dash-muted">{pending.length} submission(s)</span>
          </div>
          {loading ? (
            <div className="dash-skeleton">
              <div /><div /><div />
            </div>
          ) : pending.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">✓</div>
              <h3>All caught up</h3>
              <p>No submissions are waiting on you right now.</p>
            </div>
          ) : (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Shift</th>
                  <th>Staff</th>
                  <th>Submitted</th>
                  <th>Completion</th>
                  <th>Mandatory</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => {
                  const stats = completionStats(row);
                  return (
                    <tr key={row.id} className="dash-row-click" onClick={() => openSubmission(row)}>
                      <td>{row.station?.name || "-"}</td>
                      <td>{row.shift?.name || "-"}</td>
                      <td>{row.staff?.name || "-"}</td>
                      <td>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}</td>
                      <td>
                        <div className="dash-progress sm">
                          <div className="dash-progress-bar" style={{ width: `${stats.percent}%` }} />
                        </div>
                        <span className="dash-progress-label">{stats.done}/{stats.total} · {stats.percent}%</span>
                      </td>
                      <td>
                        {stats.mandatoryMissing > 0 ? (
                          <span className="pill pill-red">{stats.mandatoryMissing} missing</span>
                        ) : (
                          <span className="pill pill-green">All done</span>
                        )}
                      </td>
                      <td><span className="dash-link">Open →</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* History */}
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>History</h2>
            <div className="dash-filters">
              <input
                type="search"
                placeholder="Search station / shift / staff…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All status</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}>
                <option value="all">All stations</option>
                {stations.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          {filteredHistory.length === 0 ? (
            <div className="dash-empty small">
              <p>No history matches the filters.</p>
            </div>
          ) : (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Station</th>
                  <th>Shift</th>
                  <th>Staff</th>
                  <th>Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((row) => (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td><StatusPill status={row.status} /></td>
                    <td>{row.station?.name || "-"}</td>
                    <td>{row.shift?.name || "-"}</td>
                    <td>{row.staff?.name || "-"}</td>
                    <td>{row.supervisor?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>

      {/* Detail drawer */}
      {selected && (
        <div className="dash-drawer-overlay" onClick={closeDrawer}>
          <aside className="dash-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="dash-drawer-head">
              <div>
                <p className="dash-eyebrow">Submission #{selected.id}</p>
                <h2>{selected.template?.title || "Checklist"}</h2>
                <p className="dash-muted">
                  {selected.station?.name} · {selected.shift?.name} · by {selected.staff?.name}
                </p>
              </div>
              <button className="dash-btn-ghost" onClick={closeDrawer}>✕</button>
            </div>

            {(() => {
              const stats = completionStats(selected);
              return (
                <div className="dash-drawer-stats">
                  <div>
                    <span className="dash-muted">Completion</span>
                    <div className="dash-progress">
                      <div className="dash-progress-bar" style={{ width: `${stats.percent}%` }} />
                    </div>
                    <strong>{stats.done}/{stats.total} ({stats.percent}%)</strong>
                  </div>
                  <div>
                    <span className="dash-muted">Mandatory</span>
                    {stats.mandatoryMissing > 0 ? (
                      <span className="pill pill-red lg">{stats.mandatoryMissing} missing</span>
                    ) : (
                      <span className="pill pill-green lg">All complete</span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="dash-drawer-section">
              <h4>Checklist items</h4>
              <ul className="dash-checklist-view">
                {(selected.template?.items || []).map((item) => {
                  const r = (selected.items || []).find((x) => x.templateItemId === item.id);
                  const done = r?.completed === true;
                  return (
                    <li key={item.id} className={done ? "done" : "pending"}>
                      <span className={`check ${done ? "on" : "off"}`}>{done ? "✓" : ""}</span>
                      <div>
                        <div className="dash-checklist-label">
                          {item.label}
                          {item.isMandatory && <span className="pill pill-amber sm">Required</span>}
                        </div>
                        {r?.remark && <div className="dash-checklist-remark">“{r.remark}”</div>}
                      </div>
                      {done ? <span className="pill pill-green sm">Done</span> : <span className="pill pill-gray sm">Pending</span>}
                    </li>
                  );
                })}
              </ul>
            </div>

            {selected.staffRemark && (
              <div className="dash-drawer-section">
                <h4>Staff remark</h4>
                <p className="dash-remark-box">{selected.staffRemark}</p>
              </div>
            )}

            {selected.status === "submitted" && (
              <div className="dash-drawer-foot">
                {decisionMode === null && (
                  <>
                    <button className="dash-btn-danger" onClick={() => setDecisionMode("reject")}>
                      Reject
                    </button>
                    <button className="dash-btn-primary" onClick={() => setDecisionMode("approve")}>
                      Approve
                    </button>
                  </>
                )}

                {decisionMode === "approve" && (
                  <div className="dash-decision">
                    <label>
                      Comment (optional)
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Verified and approved"
                      />
                    </label>
                    <div className="dash-decision-actions">
                      <button className="dash-btn-ghost" onClick={() => setDecisionMode(null)} disabled={submitting}>Cancel</button>
                      <button className="dash-btn-primary" onClick={handleApprove} disabled={submitting}>
                        {submitting ? "Approving…" : "Confirm approve"}
                      </button>
                    </div>
                  </div>
                )}

                {decisionMode === "reject" && (
                  <div className="dash-decision">
                    <label>
                      Rejection reason <span className="required">*</span>
                      <textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="What needs to be fixed?"
                      />
                    </label>
                    <label>
                      Comment (optional)
                      <textarea
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </label>
                    <div className="dash-decision-actions">
                      <button className="dash-btn-ghost" onClick={() => setDecisionMode(null)} disabled={submitting}>Cancel</button>
                      <button className="dash-btn-danger" onClick={handleReject} disabled={submitting}>
                        {submitting ? "Rejecting…" : "Confirm reject"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
