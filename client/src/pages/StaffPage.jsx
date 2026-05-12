import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

function parseShiftDateTime(assignmentDate, hhmm) {
  if (!assignmentDate || !hhmm) return null;
  const d = new Date(assignmentDate);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function formatCountdown(ms) {
  if (ms <= 0) return "Expired";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function shiftWindowStatus(assignment) {
  if (!assignment) return { state: "unknown", remainingMs: 0 };
  const start = parseShiftDateTime(assignment.assignmentDate, assignment.shift.startTime);
  const end = parseShiftDateTime(assignment.assignmentDate, assignment.shift.endTime);
  const now = new Date();
  if (!start || !end) return { state: "unknown", remainingMs: 0 };
  if (now < start) return { state: "upcoming", remainingMs: start - now, start, end };
  if (now > end) return { state: "expired", remainingMs: 0, start, end };
  return { state: "active", remainingMs: end - now, start, end };
}

export default function StaffPage({ auth, onLogout }) {
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [checklistData, setChecklistData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [staffRemark, setStaffRemark] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  async function loadMyShifts() {
    setError("");
    setLoading(true);
    try {
      const response = await api.get("/staff/my-shifts/today");
      const list = response.data.data || [];
      setShifts(list);
      if (list.length > 0 && !selectedShiftId) {
        loadChecklist(list[0].shiftId);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load shifts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyShifts();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadChecklist(shiftId) {
    setError("");
    setSelectedShiftId(shiftId);
    try {
      const response = await api.get(`/staff/checklists/${shiftId}`);
      const data = response.data.data;
      setChecklistData(data);
      setStaffRemark(data?.submission?.staffRemark || "");
      const existing = data?.submission?.items || [];
      const mapped = data.template.items.map((item) => {
        const found = existing.find((entry) => entry.templateItemId === item.id);
        return {
          templateItemId: item.id,
          completed: found?.completed ?? false,
          valueText: found?.valueText ?? "",
          remark: found?.remark ?? "",
          label: item.label,
          isMandatory: item.isMandatory,
        };
      });
      setResponses(mapped);
    } catch (err) {
      setChecklistData(null);
      setError(err?.response?.data?.message || "Failed to load checklist.");
    }
  }

  function updateResponse(itemId, key, value) {
    setResponses((prev) =>
      prev.map((entry) =>
        entry.templateItemId === itemId ? { ...entry, [key]: value } : entry
      )
    );
  }

  const activeAssignment = useMemo(() => {
    return shifts.find((a) => a.shiftId === selectedShiftId) || shifts[0];
  }, [shifts, selectedShiftId]);

  const shiftWindow = useMemo(() => shiftWindowStatus(activeAssignment), [activeAssignment, now]);

  const stats = useMemo(() => {
    const total = responses.length;
    const done = responses.filter((r) => r.completed).length;
    const mandatoryMissing = responses.filter((r) => r.isMandatory && !r.completed);
    return {
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
      mandatoryMissing,
    };
  }, [responses]);

  const submissionStatus = checklistData?.submission?.status;
  const canSubmit =
    shiftWindow.state === "active" &&
    stats.mandatoryMissing.length === 0 &&
    submissionStatus !== "approved";

  async function submitChecklist() {
    if (!selectedShiftId) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        staffRemark,
        responses: responses.map((entry) => ({
          templateItemId: entry.templateItemId,
          completed: Boolean(entry.completed),
          valueText: entry.valueText,
          remark: entry.remark,
        })),
      };
      await api.post(`/staff/checklists/${selectedShiftId}/submit`, payload);
      showToast("Checklist submitted ✓");
      await loadChecklist(selectedShiftId);
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const countdownLabel =
    shiftWindow.state === "active"
      ? formatCountdown(shiftWindow.remainingMs)
      : shiftWindow.state === "upcoming"
        ? `Starts in ${formatCountdown(shiftWindow.remainingMs)}`
        : shiftWindow.state === "expired"
          ? "Shift window closed"
          : "—";

  const countdownClass =
    shiftWindow.state === "active" && shiftWindow.remainingMs < 30 * 60 * 1000
      ? "danger"
      : shiftWindow.state === "active"
        ? "active"
        : shiftWindow.state === "upcoming"
          ? "upcoming"
          : "expired";

  return (
    <main className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dash-brand-mark">MCS</span>
          <span className="dash-brand-name">Staff</span>
        </div>
        <div className="dash-user">
          <div className="dash-avatar emerald">{auth.user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="dash-user-name">{auth.user.name}</div>
            <div className="dash-user-role">staff</div>
          </div>
        </div>
        <nav className="dash-nav">
          <button className="dash-nav-btn active"><span>◉</span> Today's checklists</button>
        </nav>
        <button className="dash-logout" onClick={onLogout}>Logout</button>
      </aside>

      <section className="dash-main">
        <header className="dash-header">
          <div>
            <h1>Today's checklists</h1>
            <p className="dash-muted">Tick off each item, add remarks, and submit before the shift closes.</p>
          </div>
          <button className="dash-btn-outline" onClick={loadMyShifts}>Refresh</button>
        </header>

        {error && <div className="dash-alert error">{error}</div>}
        {toast && <div className="dash-toast">{toast}</div>}

        {loading ? (
          <div className="dash-skeleton"><div /><div /><div /></div>
        ) : shifts.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">∅</div>
            <h3>No shifts assigned today</h3>
            <p>Talk to your supervisor to get added to a shift.</p>
          </div>
        ) : (
          <>
            {/* Hero shift card */}
            {activeAssignment && (
              <section className={`staff-hero ${countdownClass}`}>
                <div className="staff-hero-left">
                  <p className="dash-eyebrow">Current shift</p>
                  <h2>{activeAssignment.shift.station?.name || "—"}</h2>
                  <p className="staff-hero-shift">
                    {activeAssignment.shift.name} · {activeAssignment.shift.startTime}–{activeAssignment.shift.endTime}
                  </p>
                  <div className="staff-hero-meta">
                    <span>📅 {new Date(activeAssignment.assignmentDate).toLocaleDateString()}</span>
                    <span>🌐 {activeAssignment.shift.timezone || "Asia/Kolkata"}</span>
                  </div>
                </div>
                <div className="staff-hero-right">
                  <p className="dash-muted">{shiftWindow.state === "active" ? "Time remaining" : "Status"}</p>
                  <div className="staff-countdown">{countdownLabel}</div>
                  {checklistData && (
                    <div className="staff-hero-progress">
                      <div className="dash-progress lg">
                        <div className="dash-progress-bar" style={{ width: `${stats.percent}%` }} />
                      </div>
                      <div className="staff-hero-progress-label">
                        <strong>{stats.done}/{stats.total}</strong> done · {stats.percent}%
                        {stats.mandatoryMissing.length > 0 && (
                          <span className="pill pill-amber">{stats.mandatoryMissing.length} mandatory left</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Shift switcher (if multiple) */}
            {shifts.length > 1 && (
              <section className="staff-switcher">
                {shifts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`staff-switcher-card ${a.shiftId === selectedShiftId ? "active" : ""}`}
                    onClick={() => loadChecklist(a.shiftId)}
                  >
                    <div className="staff-switcher-name">{a.shift.name}</div>
                    <div className="staff-switcher-station">{a.shift.station?.name}</div>
                    <div className="staff-switcher-time">{a.shift.startTime}–{a.shift.endTime}</div>
                  </button>
                ))}
              </section>
            )}

            {/* Checklist body */}
            {checklistData && (
              <section className="dash-card">
                <div className="dash-card-head">
                  <div>
                    <h2>{checklistData.template.title}</h2>
                    <p className="dash-muted">
                      {submissionStatus
                        ? <>Current status: <strong>{submissionStatus}</strong></>
                        : "No submission yet"}
                    </p>
                  </div>
                </div>

                {submissionStatus === "rejected" && checklistData.submission?.rejectionReason && (
                  <div className="dash-alert warning">
                    <strong>Rejected:</strong> {checklistData.submission.rejectionReason}
                  </div>
                )}

                <div className="staff-items">
                  {responses.map((item, idx) => (
                    <label
                      key={item.templateItemId}
                      className={`staff-item ${item.completed ? "done" : ""} ${item.isMandatory && !item.completed ? "mandatory-missing" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.completed)}
                        onChange={(e) => updateResponse(item.templateItemId, "completed", e.target.checked)}
                      />
                      <div className="staff-item-body">
                        <div className="staff-item-head">
                          <span className="staff-item-num">{idx + 1}</span>
                          <span className="staff-item-label">{item.label}</span>
                          {item.isMandatory && <span className="pill pill-amber sm">★ Required</span>}
                          {item.completed && <span className="pill pill-green sm">Done</span>}
                        </div>
                        <input
                          className="staff-item-remark"
                          placeholder="Add a remark (optional)…"
                          value={item.remark}
                          onChange={(e) => updateResponse(item.templateItemId, "remark", e.target.value)}
                        />
                      </div>
                    </label>
                  ))}
                </div>

                <div className="staff-remark-box">
                  <label>
                    Shift remark
                    <textarea
                      rows={3}
                      value={staffRemark}
                      onChange={(e) => setStaffRemark(e.target.value)}
                      placeholder="Anything the supervisor should know about this shift?"
                    />
                  </label>
                </div>

                {/* Sticky submit bar */}
                <div className="staff-submit-bar">
                  <div className="staff-submit-info">
                    <strong>{stats.done}/{stats.total}</strong> items done
                    {stats.mandatoryMissing.length > 0 && (
                      <span className="pill pill-red">
                        {stats.mandatoryMissing.length} mandatory item{stats.mandatoryMissing.length === 1 ? "" : "s"} left
                      </span>
                    )}
                    {shiftWindow.state === "expired" && <span className="pill pill-gray">Shift expired</span>}
                  </div>
                  <button
                    className="dash-btn-primary lg"
                    onClick={submitChecklist}
                    disabled={!canSubmit || submitting}
                    title={
                      stats.mandatoryMissing.length > 0
                        ? `Missing: ${stats.mandatoryMissing.map((m) => m.label).join(", ")}`
                        : shiftWindow.state !== "active"
                          ? "Shift window not active"
                          : ""
                    }
                  >
                    {submitting ? "Submitting…" : submissionStatus === "submitted" ? "Resubmit" : "Submit checklist"}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
