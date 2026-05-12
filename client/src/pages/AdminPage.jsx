import { useEffect, useMemo, useState } from "react";
import api from "../api";

const sectionConfig = {
  stations: {
    title: "Stations",
    endpoint: "/admin/stations",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "code", label: "Code" },
      { key: "isActive", label: "Active" },
    ],
    defaults: { name: "", code: "", description: "" },
  },
  users: {
    title: "Users",
    endpoint: "/admin/users",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "isActive", label: "Active" },
    ],
    defaults: { name: "", email: "", password: "", role: "staff", isActive: true },
  },
  shifts: {
    title: "Shifts",
    endpoint: "/admin/shifts",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Shift" },
      { key: "station.name", label: "Station" },
      { key: "startTime", label: "Start" },
      { key: "endTime", label: "End" },
    ],
    defaults: {
      stationId: "",
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      timezone: "Asia/Kolkata",
      assignmentDate: new Date().toISOString().slice(0, 10),
      assignedStaffIds: [],
      assignedSupervisorIds: [],
    },
  },
  templates: {
    title: "Templates",
    endpoint: "/admin/templates",
    columns: [
      { key: "id", label: "ID" },
      { key: "title", label: "Title" },
      { key: "station.name", label: "Station" },
      { key: "version", label: "Version" },
      { key: "isActive", label: "Active" },
    ],
    defaults: {
      stationId: "",
      title: "",
      version: "1",
      isActive: true,
      items: [{ label: "Clean floor" }, { label: "Check bins" }],
    },
  },
};

const sectionIcons = {
  overview: "▤",
  stations: "⌂",
  users: "⎈",
  shifts: "⏱",
  templates: "▦",
};

function valueAtPath(row, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], row);
}

function boolText(value) {
  return value ? "Yes" : "No";
}

function toDateValue(input) {
  if (!input) return new Date().toISOString().slice(0, 10);
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function normalizeForForm(section, row) {
  if (section === "stations") {
    return { name: row.name || "", code: row.code || "", description: row.description || "" };
  }
  if (section === "users") {
    return {
      name: row.name || "",
      email: row.email || "",
      password: "",
      role: row.role || "staff",
      isActive: Boolean(row.isActive),
    };
  }
  if (section === "shifts") {
    const staffIds = (row.assignments || [])
      .filter((item) => item.assignmentRole === "staff")
      .map((item) => Number(item.userId));
    const supervisorIds = (row.assignments || [])
      .filter((item) => item.assignmentRole === "supervisor")
      .map((item) => Number(item.userId));
    return {
      stationId: String(row.stationId || ""),
      name: row.name || "",
      startTime: row.startTime || "09:00",
      endTime: row.endTime || "17:00",
      timezone: row.timezone || "Asia/Kolkata",
      assignmentDate: toDateValue(row.assignmentDate),
      assignedStaffIds: staffIds,
      assignedSupervisorIds: supervisorIds,
    };
  }
  return {
    stationId: String(row.stationId || ""),
    title: row.title || "",
    version: String(row.version || 1),
    isActive: Boolean(row.isActive),
    items:
      (row.items || []).length > 0
        ? row.items.map((item) => ({ label: item.label || "" }))
        : [{ label: "" }],
  };
}

function buildPayload(section, form, isEdit) {
  if (section === "stations") {
    return {
      name: form.name,
      code: form.code,
      description: form.description,
    };
  }
  if (section === "users") {
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      isActive: Boolean(form.isActive),
    };
    if (!isEdit || form.password) {
      payload.password = form.password;
    }
    return payload;
  }
  if (section === "shifts") {
    return {
      stationId: Number(form.stationId),
      name: form.name,
      startTime: form.startTime,
      endTime: form.endTime,
      timezone: form.timezone,
      assignmentDate: new Date(`${form.assignmentDate}T00:00:00`).toISOString(),
      assignedStaffIds: form.assignedStaffIds,
      assignedSupervisorIds: form.assignedSupervisorIds,
    };
  }

  const cleanItems = (form.items || [])
    .map((item) => item.label.trim())
    .filter(Boolean);

  return {
    stationId: Number(form.stationId),
    title: form.title,
    version: Number(form.version || 1),
    isActive: Boolean(form.isActive),
    items: cleanItems.map((label, index) => ({
      label,
      displayOrder: index,
      isMandatory: true,
      inputType: "boolean",
    })),
  };
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function StatusPill({ value }) {
  if (typeof value === "boolean") {
    return <span className={`pill ${value ? "pill-green" : "pill-gray"}`}>{value ? "Active" : "Inactive"}</span>;
  }
  const map = {
    admin: "pill-indigo",
    staff: "pill-emerald",
    supervisor: "pill-violet",
    submitted: "pill-indigo",
    approved: "pill-green",
    rejected: "pill-red",
    draft: "pill-gray",
  };
  return <span className={`pill ${map[value] || "pill-gray"}`}>{value}</span>;
}

function Donut({ summary }) {
  const entries = [
    { key: "approved", color: "#10b981", label: "Approved" },
    { key: "submitted", color: "#4f46e5", label: "Submitted" },
    { key: "rejected", color: "#ef4444", label: "Rejected" },
    { key: "draft", color: "#94a3b8", label: "Draft" },
  ];
  const total = entries.reduce((sum, e) => sum + (summary[e.key] || 0), 0);
  let offset = 0;
  const circumference = 2 * Math.PI * 60;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" className="donut">
        <circle cx="80" cy="80" r="60" fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {total > 0 && entries.map((e) => {
          const value = summary[e.key] || 0;
          if (value === 0) return null;
          const length = (value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const seg = (
            <circle
              key={e.key}
              cx="80" cy="80" r="60"
              fill="none"
              stroke={e.color}
              strokeWidth="20"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
            />
          );
          offset += length;
          return seg;
        })}
        <text x="80" y="76" textAnchor="middle" className="donut-num">{total}</text>
        <text x="80" y="96" textAnchor="middle" className="donut-label">Submissions</text>
      </svg>
      <ul className="donut-legend">
        {entries.map((e) => (
          <li key={e.key}>
            <span className="donut-swatch" style={{ background: e.color }} />
            <span>{e.label}</span>
            <strong>{summary[e.key] || 0}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShiftTimeline({ shifts, stations }) {
  const today = new Date().toISOString().slice(0, 10);
  const todays = shifts.filter((s) => {
    const list = s.assignments || [];
    return list.some((a) => toDateValue(a.assignmentDate) === today);
  });
  const byStation = new Map();
  for (const s of todays) {
    const list = byStation.get(s.stationId) || [];
    list.push(s);
    byStation.set(s.stationId, list);
  }
  if (byStation.size === 0) {
    return <div className="dash-empty small"><p>No shifts scheduled for today.</p></div>;
  }
  return (
    <div className="timeline">
      <div className="timeline-hours">
        {[0, 4, 8, 12, 16, 20, 24].map((h) => (
          <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{String(h).padStart(2, "0")}:00</span>
        ))}
      </div>
      {Array.from(byStation.entries()).map(([stationId, list]) => {
        const station = stations.find((s) => s.id === stationId);
        return (
          <div key={stationId} className="timeline-row">
            <div className="timeline-station">{station?.name || `#${stationId}`}</div>
            <div className="timeline-track">
              {list.map((s) => {
                const startM = timeToMinutes(s.startTime);
                const endM = timeToMinutes(s.endTime);
                const left = (startM / (24 * 60)) * 100;
                const width = Math.max(((endM - startM) / (24 * 60)) * 100, 2);
                const count = (s.assignments || []).length;
                return (
                  <div
                    key={s.id}
                    className="timeline-block"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${s.name} · ${s.startTime}–${s.endTime} · ${count} assigned`}
                  >
                    <span>{s.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage({ auth, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [panelMode, setPanelMode] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(sectionConfig.stations.defaults);
  const [lookups, setLookups] = useState({ stations: [], staff: [], supervisors: [], users: [] });
  const [report, setReport] = useState(null);
  const [allShifts, setAllShifts] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const activeConfig = activeSection !== "overview" ? sectionConfig[activeSection] : null;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadLookups() {
    try {
      const [stationResponse, userResponse, shiftsResponse] = await Promise.all([
        api.get("/admin/stations"),
        api.get("/admin/users"),
        api.get("/admin/shifts"),
      ]);
      const stations = stationResponse.data.data || [];
      const users = userResponse.data.data || [];
      const shifts = shiftsResponse.data.data || [];
      setLookups({
        stations,
        users,
        staff: users.filter((item) => item.role === "staff" && item.isActive),
        supervisors: users.filter((item) => item.role === "supervisor" && item.isActive),
      });
      setAllShifts(shifts);
    } catch {
      setLookups({ stations: [], staff: [], supervisors: [], users: [] });
    }
  }

  async function loadReport() {
    setOverviewLoading(true);
    try {
      const r = await api.get("/admin/reports/checklists");
      setReport(r.data.data || null);
    } catch {
      setReport(null);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadSection(section = activeSection) {
    if (section === "overview") return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(sectionConfig[section].endpoint);
      setRows(response.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
    loadReport();
  }, []);

  useEffect(() => {
    setPanelMode(null);
    setSelectedRow(null);
    setSearch("");
    if (activeSection !== "overview") {
      setForm(sectionConfig[activeSection].defaults);
      loadSection(activeSection);
    }
  }, [activeSection]);

  function openCreate() {
    setError("");
    setSelectedRow(null);
    setForm(activeConfig.defaults);
    setPanelMode("create");
  }

  function openEdit(row) {
    setError("");
    setSelectedRow(row);
    setForm(normalizeForForm(activeSection, row));
    setPanelMode("edit");
  }

  function openView(row) {
    setError("");
    setSelectedRow(row);
    setPanelMode("view");
  }

  async function performDelete(row) {
    setError("");
    try {
      await api.delete(`${activeConfig.endpoint}/${row.id}`);
      setConfirmDelete(null);
      showToast(`${activeConfig.title.slice(0, -1)} deleted.`);
      await Promise.all([loadSection(), loadLookups(), loadReport()]);
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed.");
      setConfirmDelete(null);
    }
  }

  function toggleSelectId(field, id) {
    const numericId = Number(id);
    setForm((prev) => {
      const current = prev[field] || [];
      const exists = current.includes(numericId);
      return {
        ...prev,
        [field]: exists ? current.filter((item) => item !== numericId) : [...current, numericId],
      };
    });
  }

  function updateTemplateItem(index, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, label: value } : item)),
    }));
  }

  function addTemplateItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { label: "" }] }));
  }

  function removeTemplateItem(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setError("");

    if (activeSection === "shifts") {
      const today = new Date().toISOString().slice(0, 10);
      if (form.assignmentDate && form.assignmentDate < today) {
        setError("Assignment date cannot be in the past.");
        return;
      }
      if (form.startTime && form.endTime && form.endTime <= form.startTime) {
        setError("End time must be after start time.");
        return;
      }
      if (form.assignmentDate && form.endTime) {
        const [h, m] = form.endTime.split(":").map(Number);
        const endDate = new Date(`${form.assignmentDate}T00:00:00`);
        endDate.setHours(h || 0, m || 0, 0, 0);
        if (endDate < new Date()) {
          setError("This shift end time has already passed. Pick a later end time or future date.");
          return;
        }
      }
    }

    try {
      const payload = buildPayload(activeSection, form, panelMode === "edit");
      if (panelMode === "create") {
        await api.post(activeConfig.endpoint, payload);
        showToast(`${activeConfig.title.slice(0, -1)} created.`);
      } else if (panelMode === "edit" && selectedRow?.id) {
        await api.put(`${activeConfig.endpoint}/${selectedRow.id}`, payload);
        showToast(`${activeConfig.title.slice(0, -1)} updated.`);
      }
      await Promise.all([loadSection(), loadLookups(), loadReport()]);
      setPanelMode(null);
      setSelectedRow(null);
      setForm(activeConfig.defaults);
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed. Check required fields.");
    }
  }

  function renderFormFields() {
    if (activeSection === "stations") {
      return (
        <>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
          <label>
            Description
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
        </>
      );
    }
    if (activeSection === "users") {
      return (
        <>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={panelMode === "edit" ? "Leave blank to keep existing password" : ""}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
              <option value="supervisor">supervisor</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(form.isActive)}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active user
          </label>
        </>
      );
    }
    if (activeSection === "shifts") {
      const shiftEndDate = (() => {
        if (!form.assignmentDate || !form.endTime) return null;
        const [h, m] = form.endTime.split(":").map(Number);
        const d = new Date(`${form.assignmentDate}T00:00:00`);
        d.setHours(h || 0, m || 0, 0, 0);
        return d;
      })();
      const isPast = shiftEndDate && shiftEndDate < new Date();
      const today = new Date().toISOString().slice(0, 10);
      const isPastDate = form.assignmentDate && form.assignmentDate < today;
      const timeInverted =
        form.startTime && form.endTime && form.endTime <= form.startTime;
      return (
        <>
          <label>
            Station
            <select value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
              <option value="">Select station</option>
              {lookups.stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.code})
                </option>
              ))}
            </select>
          </label>
          <label>Shift Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Start Time<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></label>
          <label>End Time<input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></label>
          <label>Timezone<input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></label>
          <label>
            Assignment Date
            <input type="date" min={today} value={form.assignmentDate} onChange={(e) => setForm({ ...form, assignmentDate: e.target.value })} />
          </label>
          {timeInverted && (
            <div className="dash-alert error">
              End time must be after start time.
            </div>
          )}
          {!timeInverted && isPastDate && (
            <div className="dash-alert error">
              Assignment date is in the past — pick today or later.
            </div>
          )}
          {!timeInverted && !isPastDate && isPast && (
            <div className="dash-alert warning">
              <strong>⚠ This shift is already over.</strong> The end time has passed,
              so staff will see <em>"Shift window closed"</em> and cannot submit. Pick a later
              end time or a future date.
            </div>
          )}
          <div>
            <p className="muted">Assign Staff</p>
            <div className="choice-grid">
              {lookups.staff.length === 0 ? (
                <p className="muted">No active staff users found.</p>
              ) : (
                lookups.staff.map((user) => (
                  <label key={user.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(form.assignedStaffIds || []).includes(user.id)}
                      onChange={() => toggleSelectId("assignedStaffIds", user.id)}
                    />
                    {user.name} ({user.email})
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="muted">Assign Supervisors</p>
            <div className="choice-grid">
              {lookups.supervisors.length === 0 ? (
                <p className="muted">No active supervisors found.</p>
              ) : (
                lookups.supervisors.map((user) => (
                  <label key={user.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(form.assignedSupervisorIds || []).includes(user.id)}
                      onChange={() => toggleSelectId("assignedSupervisorIds", user.id)}
                    />
                    {user.name} ({user.email})
                  </label>
                ))
              )}
            </div>
          </div>
        </>
      );
    }
    return (
      <>
        <label>
          Station
          <select value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
            <option value="">Select station</option>
            {lookups.stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.code})
              </option>
            ))}
          </select>
        </label>
        <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Version<input type="number" min="1" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(form.isActive)}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active template
        </label>
        <div>
          <div className="row-between">
            <p className="muted">Checklist Items</p>
            <button type="button" className="btn-subtle" onClick={addTemplateItem}>Add item</button>
          </div>
          <div className="form-grid">
            {(form.items || []).map((item, index) => (
              <div key={index} className="item-row">
                <input
                  value={item.label}
                  onChange={(e) => updateTemplateItem(index, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                />
                <button type="button" className="btn-danger" onClick={() => removeTemplateItem(index)} disabled={(form.items || []).length === 1}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderViewContent() {
    if (!selectedRow) return null;
    if (activeSection === "stations") {
      return (
        <dl className="view-grid">
          <dt>Name</dt><dd>{selectedRow.name || "-"}</dd>
          <dt>Code</dt><dd>{selectedRow.code || "-"}</dd>
          <dt>Description</dt><dd>{selectedRow.description || "-"}</dd>
          <dt>Active</dt><dd>{boolText(selectedRow.isActive)}</dd>
        </dl>
      );
    }
    if (activeSection === "users") {
      return (
        <dl className="view-grid">
          <dt>Name</dt><dd>{selectedRow.name || "-"}</dd>
          <dt>Email</dt><dd>{selectedRow.email || "-"}</dd>
          <dt>Role</dt><dd>{selectedRow.role || "-"}</dd>
          <dt>Active</dt><dd>{boolText(selectedRow.isActive)}</dd>
        </dl>
      );
    }
    if (activeSection === "shifts") {
      const staffAssignments = (selectedRow.assignments || []).filter((item) => item.assignmentRole === "staff");
      const supervisorAssignments = (selectedRow.assignments || []).filter((item) => item.assignmentRole === "supervisor");
      return (
        <div className="form-grid">
          <dl className="view-grid">
            <dt>Station</dt><dd>{selectedRow.station?.name || "-"}</dd>
            <dt>Shift</dt><dd>{selectedRow.name || "-"}</dd>
            <dt>Time</dt><dd>{selectedRow.startTime} - {selectedRow.endTime}</dd>
            <dt>Timezone</dt><dd>{selectedRow.timezone || "-"}</dd>
            <dt>Date</dt><dd>{toDateValue(selectedRow.assignmentDate)}</dd>
          </dl>
          <div>
            <p className="muted">Assigned Staff</p>
            <ul className="simple-list">
              {staffAssignments.length === 0 ? <li>-</li> : staffAssignments.map((item) => <li key={item.id}>{item.user?.name || item.userId}</li>)}
            </ul>
          </div>
          <div>
            <p className="muted">Assigned Supervisors</p>
            <ul className="simple-list">
              {supervisorAssignments.length === 0 ? <li>-</li> : supervisorAssignments.map((item) => <li key={item.id}>{item.user?.name || item.userId}</li>)}
            </ul>
          </div>
        </div>
      );
    }
    return (
      <div className="form-grid">
        <dl className="view-grid">
          <dt>Station</dt><dd>{selectedRow.station?.name || "-"}</dd>
          <dt>Title</dt><dd>{selectedRow.title || "-"}</dd>
          <dt>Version</dt><dd>{selectedRow.version || "-"}</dd>
          <dt>Active</dt><dd>{boolText(selectedRow.isActive)}</dd>
        </dl>
        <div>
          <p className="muted">Checklist Items</p>
          <ul className="simple-list">
            {(selectedRow.items || []).length === 0 ? <li>-</li> : selectedRow.items.map((item) => <li key={item.id || item.label}>{item.label}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) => {
      return activeConfig.columns.some((col) => {
        const v = valueAtPath(row, col.key);
        return String(v ?? "").toLowerCase().includes(term);
      });
    });
  }, [rows, search, activeConfig]);

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const shiftsToday = allShifts.filter((s) =>
      (s.assignments || []).some((a) => toDateValue(a.assignmentDate) === today)
    ).length;
    return {
      stations: lookups.stations.length,
      activeUsers: lookups.users.filter((u) => u.isActive).length,
      totalUsers: lookups.users.length,
      shiftsToday,
      pending: report?.statusSummary?.submitted || 0,
    };
  }, [lookups, allShifts, report]);

  return (
    <main className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dash-brand-mark">MCS</span>
          <span className="dash-brand-name">Admin</span>
        </div>
        <div className="dash-user">
          <div className="dash-avatar indigo">{auth.user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="dash-user-name">{auth.user.name}</div>
            <div className="dash-user-role">admin</div>
          </div>
        </div>
        <nav className="dash-nav">
          <button
            className={`dash-nav-btn ${activeSection === "overview" ? "active" : ""}`}
            onClick={() => setActiveSection("overview")}
          >
            <span>{sectionIcons.overview}</span> Overview
          </button>
          {Object.keys(sectionConfig).map((section) => (
            <button
              key={section}
              className={`dash-nav-btn ${activeSection === section ? "active" : ""}`}
              onClick={() => setActiveSection(section)}
            >
              <span>{sectionIcons[section]}</span> {sectionConfig[section].title}
            </button>
          ))}
        </nav>
        <button className="dash-logout" onClick={onLogout}>Logout</button>
      </aside>

      <section className="dash-main">
        {activeSection === "overview" ? (
          <>
            <header className="dash-header">
              <div>
                <h1>Overview</h1>
                <p className="dash-muted">Today at a glance across stations, users and submissions.</p>
              </div>
              <button className="dash-btn-outline" onClick={() => { loadLookups(); loadReport(); }}>Refresh</button>
            </header>

            {toast && <div className="dash-toast">{toast}</div>}

            <div className="dash-kpi-grid">
              <div className="dash-kpi indigo">
                <span className="dash-kpi-label">Stations</span>
                <strong>{kpis.stations}</strong>
                <span className="dash-kpi-hint">Total configured</span>
              </div>
              <div className="dash-kpi emerald">
                <span className="dash-kpi-label">Active users</span>
                <strong>{kpis.activeUsers}</strong>
                <span className="dash-kpi-hint">of {kpis.totalUsers} total</span>
              </div>
              <div className="dash-kpi violet">
                <span className="dash-kpi-label">Shifts today</span>
                <strong>{kpis.shiftsToday}</strong>
                <span className="dash-kpi-hint">Across all stations</span>
              </div>
              <div className="dash-kpi amber">
                <span className="dash-kpi-label">Pending approvals</span>
                <strong>{kpis.pending}</strong>
                <span className="dash-kpi-hint">Awaiting supervisor</span>
              </div>
            </div>

            <div className="overview-grid">
              <section className="dash-card">
                <div className="dash-card-head">
                  <h2>Submission status</h2>
                  <span className="dash-muted">All-time</span>
                </div>
                {overviewLoading ? (
                  <div className="dash-skeleton"><div /><div /></div>
                ) : (
                  <Donut summary={report?.statusSummary || { draft: 0, submitted: 0, approved: 0, rejected: 0 }} />
                )}
              </section>

              <section className="dash-card wide">
                <div className="dash-card-head">
                  <h2>Today's shift coverage</h2>
                  <span className="dash-muted">{new Date().toLocaleDateString()}</span>
                </div>
                <ShiftTimeline shifts={allShifts} stations={lookups.stations} />
              </section>
            </div>

            <section className="dash-card">
              <div className="dash-card-head">
                <h2>Recent submissions</h2>
                <span className="dash-muted">Latest 8</span>
              </div>
              {(report?.submissions || []).length === 0 ? (
                <div className="dash-empty small"><p>No submissions yet.</p></div>
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
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.submissions || []).slice(0, 8).map((s) => (
                      <tr key={s.id}>
                        <td>#{s.id}</td>
                        <td><StatusPill value={s.status} /></td>
                        <td>{s.station?.name || "-"}</td>
                        <td>{s.shift?.name || "-"}</td>
                        <td>{s.staff?.name || "-"}</td>
                        <td>{s.supervisor?.name || "-"}</td>
                        <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : (
          <>
            <header className="dash-header">
              <div>
                <h1>{activeConfig.title}</h1>
                <p className="dash-muted">Manage records with full CRUD actions.</p>
              </div>
              <div className="dash-header-actions">
                <input
                  type="search"
                  placeholder={`Search ${activeConfig.title.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="dash-search"
                />
                <button className="dash-btn-primary" onClick={openCreate}>+ Add new</button>
              </div>
            </header>

            {error && <div className="dash-alert error">{error}</div>}
            {toast && <div className="dash-toast">{toast}</div>}

            <section className="dash-card">
              {loading ? (
                <div className="dash-skeleton"><div /><div /><div /></div>
              ) : filteredRows.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">{sectionIcons[activeSection]}</div>
                  <h3>{search ? "No matches" : `No ${activeConfig.title.toLowerCase()} yet`}</h3>
                  <p>{search ? "Try a different search term." : `Click + Add new to create your first record.`}</p>
                </div>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      {activeConfig.columns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id}>
                        {activeConfig.columns.map((column) => {
                          const value = valueAtPath(row, column.key);
                          if (typeof value === "boolean") {
                            return <td key={column.key}><StatusPill value={value} /></td>;
                          }
                          if (column.key === "role") {
                            return <td key={column.key}><StatusPill value={value} /></td>;
                          }
                          return <td key={column.key}>{String(value ?? "-")}</td>;
                        })}
                        <td className="dash-actions">
                          <button className="dash-icon-btn" title="View" onClick={() => openView(row)}>👁</button>
                          <button className="dash-icon-btn" title="Edit" onClick={() => openEdit(row)}>✎</button>
                          <button className="dash-icon-btn danger" title="Delete" onClick={() => setConfirmDelete(row)}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </section>

      {panelMode && activeConfig && (
        <div className="dash-drawer-overlay" onClick={() => setPanelMode(null)}>
          <aside className="dash-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="dash-drawer-head">
              <div>
                <p className="dash-eyebrow">{activeConfig.title.slice(0, -1)}</p>
                <h2>
                  {panelMode === "create" && "Add"}
                  {panelMode === "edit" && "Edit"}
                  {panelMode === "view" && "View"} {activeConfig.title.slice(0, -1).toLowerCase()}
                </h2>
              </div>
              <button className="dash-btn-ghost" onClick={() => setPanelMode(null)}>✕</button>
            </div>

            <div className="dash-drawer-body">
              {panelMode === "view" ? (
                renderViewContent()
              ) : (
                <form className="form-grid" onSubmit={submitForm}>
                  {renderFormFields()}
                  {error && <div className="dash-alert error">{error}</div>}
                  <button type="submit" className="dash-btn-primary block">
                    {panelMode === "create" ? "Create" : "Update"}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      )}

      {confirmDelete && (
        <div className="dash-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this {activeConfig?.title.slice(0, -1).toLowerCase()}?</h3>
            <p className="dash-muted">This action cannot be undone.</p>
            <div className="dash-modal-actions">
              <button className="dash-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="dash-btn-danger" onClick={() => performDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
