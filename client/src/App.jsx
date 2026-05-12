import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import api, { setAuthToken } from "./api";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import SupervisorPage from "./pages/SupervisorPage";

const DEMO_ACCOUNTS = [
  { role: "admin", name: "Admin", email: "admin@example.com", password: "Admin@123", tint: "indigo" },
  { role: "staff", name: "Cleaning Staff", email: "staff@example.com", password: "Staff@123", tint: "emerald" },
  { role: "supervisor", name: "Supervisor", email: "supervisor@example.com", password: "Supervisor@123", tint: "violet" },
];

const FAQS = [
  {
    q: "What happens if staff misses the shift window?",
    a: "Submissions outside the active shift window are blocked by the API. Staff can still view their checklist, but the Submit button is disabled once the window expires.",
  },
  {
    q: "Can a supervisor approve an incomplete checklist?",
    a: "No. If any mandatory item is unchecked, the API rejects the approval. Supervisors see exactly which mandatory items are missing inside the review drawer.",
  },
  {
    q: "How are checklist templates customized per station?",
    a: "Admins create templates and bind them to stations. Each template has any number of items, each flagged optional or mandatory.",
  },
  {
    q: "Is the API documented?",
    a: "Yes — Swagger UI is served at /api-docs on the backend. Every endpoint is grouped by role: Auth, Admin, Staff, Supervisor.",
  },
  {
    q: "How is authentication handled?",
    a: "JWT bearer tokens issued at login. Role is encoded in the token and enforced by middleware on every protected route.",
  },
  {
    q: "Can new roles be added later?",
    a: "The role field is a simple string on the user record and a check in middleware — a new role + a new route file is enough to extend the system.",
  },
];

function HomePage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [copied, setCopied] = useState("");

  function copy(text, key) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1200);
  }

  return (
    <main className="home-v2">
      {/* — Top nav — */}
      <header className="hv-nav">
        <div className="hv-nav-inner container">
          <Link to="/" className="hv-brand">
            <span className="hv-brand-mark">MCS</span>
            <span className="hv-brand-name">Maintenance Checklist System</span>
          </Link>
          <nav className="hv-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#roles">For your team</a>
            <a href="#demo">Live demo</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="hv-nav-actions">
            <Link className="hv-btn-ghost" to="/login">
              Sign in
            </Link>
            <a className="hv-btn-primary" href="#demo">
              Try a demo
            </a>
          </div>
        </div>
      </header>

      {/* — Hero — */}
      <section className="hv-hero">
        <div className="hv-hero-bg" aria-hidden />
        <div className="container hv-hero-inner">
          <div className="hv-hero-copy">
            <p className="hv-eyebrow">Station &amp; facility operations</p>
            <h1>
              Every shift. Every checklist.{" "}
              <span className="hv-grad">Verified.</span>
            </h1>
            <p className="hv-lead">
              Role-based maintenance and cleaning operations for stations and facilities — from shift
              assignment to supervisor sign-off, with audit-ready history.
            </p>
            <div className="hv-hero-ctas">
              <Link to="/login" className="hv-btn-primary lg">
                Sign in
              </Link>
              <a href="#demo" className="hv-btn-outline lg">
                Explore as Demo
              </a>
            </div>
            <div className="hv-trust">
              <span>● Built for stations</span>
              <span>● Audit-ready</span>
              <span>● JWT-secured</span>
            </div>
          </div>

          <div className="hv-hero-art">
            <div className="hv-mock">
              <div className="hv-mock-bar">
                <span className="hv-dot r" />
                <span className="hv-dot y" />
                <span className="hv-dot g" />
                <span className="hv-mock-title">Shift checklist — Station 4</span>
              </div>
              <div className="hv-mock-body">
                <div className="hv-mock-row done"><span className="hv-check" /> Inspect platform railing</div>
                <div className="hv-mock-row done"><span className="hv-check" /> Sanitise rest rooms</div>
                <div className="hv-mock-row done"><span className="hv-check" /> Empty waste bins <em>(mandatory)</em></div>
                <div className="hv-mock-row"><span className="hv-check off" /> Mop concourse floor</div>
                <div className="hv-mock-row"><span className="hv-check off" /> Refill sanitiser dispensers</div>
                <div className="hv-mock-foot">
                  <span>3 of 5 complete</span>
                  <span className="hv-pill">Submitted ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* — Stats bar — */}
      <section className="hv-stats">
        <div className="container hv-stats-grid">
          <div><strong>3</strong><span>Role-based dashboards</span></div>
          <div><strong>8</strong><span>Core entities tracked</span></div>
          <div><strong>24/7</strong><span>Shift coverage</span></div>
          <div><strong>100%</strong><span>Mandatory enforcement</span></div>
        </div>
      </section>

      {/* — Who uses it — */}
      <section id="roles" className="hv-section">
        <div className="container">
          <p className="hv-section-eyebrow">For your team</p>
          <h2 className="hv-section-title">Three roles, one workflow.</h2>
          <p className="hv-section-intro">
            Each role has a focused dashboard. Sign in with your account to open the right module — or use
            the demo credentials below.
          </p>
          <div className="hv-role-grid">
            <article className="hv-role-card indigo">
              <div className="hv-role-icon">⚙</div>
              <h3>Admin</h3>
              <p>Stations, users, shifts, templates, and checklist reports.</p>
              <ul>
                <li>Create &amp; assign shifts</li>
                <li>Build dynamic templates</li>
                <li>View completion reports</li>
              </ul>
            </article>
            <article className="hv-role-card emerald">
              <div className="hv-role-icon">✓</div>
              <h3>Cleaning Staff</h3>
              <p>Today&apos;s shifts, complete checklists, add remarks, submit.</p>
              <ul>
                <li>See your shift &amp; countdown</li>
                <li>Tick items &amp; add remarks</li>
                <li>Submit before window ends</li>
              </ul>
            </article>
            <article className="hv-role-card violet">
              <div className="hv-role-icon">★</div>
              <h3>Supervisor</h3>
              <p>Review submissions, approve or reject, browse shift history.</p>
              <ul>
                <li>Queue of submissions</li>
                <li>Approve / reject with notes</li>
                <li>Filterable history</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* — How it works — */}
      <section id="how" className="hv-section tinted">
        <div className="container">
          <p className="hv-section-eyebrow">How it works</p>
          <h2 className="hv-section-title">From shift assignment to sign-off.</h2>
          <div className="hv-steps">
            <div className="hv-step">
              <div className="hv-step-num">1</div>
              <h4>Admin sets up</h4>
              <p>Create stations, shifts, and checklist templates. Assign staff to shifts.</p>
            </div>
            <div className="hv-step-arrow">→</div>
            <div className="hv-step">
              <div className="hv-step-num">2</div>
              <h4>Staff opens shift</h4>
              <p>Sees the active checklist for the current shift window.</p>
            </div>
            <div className="hv-step-arrow">→</div>
            <div className="hv-step">
              <div className="hv-step-num">3</div>
              <h4>Items checked</h4>
              <p>Tick items, add remarks where needed, submit before the window closes.</p>
            </div>
            <div className="hv-step-arrow">→</div>
            <div className="hv-step">
              <div className="hv-step-num">4</div>
              <h4>Supervisor signs off</h4>
              <p>Approve or reject with comments — mandatory rules enforced.</p>
            </div>
          </div>
        </div>
      </section>

      {/* — Features bento grid — */}
      <section id="features" className="hv-section">
        <div className="container">
          <p className="hv-section-eyebrow">Features</p>
          <h2 className="hv-section-title">Everything a shift operation needs.</h2>
          <div className="hv-bento">
            <div className="hv-bento-tile wide">
              <div className="hv-feat-icon">▦</div>
              <h4>Dynamic checklist templates</h4>
              <p>Build per-station templates with mandatory and optional items. Update once — every future shift picks it up.</p>
            </div>
            <div className="hv-bento-tile">
              <div className="hv-feat-icon">⌂</div>
              <h4>Stations</h4>
              <p>Create and manage station records that anchor shifts and templates.</p>
            </div>
            <div className="hv-bento-tile">
              <div className="hv-feat-icon">⏱</div>
              <h4>Shifts</h4>
              <p>Time-windowed shifts with staff assignments and live coverage.</p>
            </div>
            <div className="hv-bento-tile">
              <div className="hv-feat-icon">⚐</div>
              <h4>Mandatory items</h4>
              <p>Submissions and approvals are blocked when required items are missing.</p>
            </div>
            <div className="hv-bento-tile wide">
              <div className="hv-feat-icon">✓</div>
              <h4>Supervisor approval flow</h4>
              <p>One-click approve or reject with comments. Every decision is recorded for audit.</p>
            </div>
            <div className="hv-bento-tile">
              <div className="hv-feat-icon">⎈</div>
              <h4>Users &amp; roles</h4>
              <p>Admin, staff and supervisor accounts with role-gated routes.</p>
            </div>
            <div className="hv-bento-tile">
              <div className="hv-feat-icon">⌕</div>
              <h4>History &amp; filters</h4>
              <p>Browse past submissions with status, station and date filters.</p>
            </div>
            <div className="hv-bento-tile">
              <div className="hv-feat-icon">🔒</div>
              <h4>JWT auth</h4>
              <p>Bearer-token auth with role middleware on every protected route.</p>
            </div>
          </div>
        </div>
      </section>

      {/* — Business rules band — */}
      <section className="hv-rules">
        <div className="container hv-rules-grid">
          <div className="hv-rule-card">
            <p className="hv-rule-label">Rule 01</p>
            <h3>Mandatory items can't be skipped.</h3>
            <p>Staff cannot submit and supervisors cannot approve a checklist while a required item is unchecked. The system tells you exactly which ones are missing.</p>
          </div>
          <div className="hv-rule-card">
            <p className="hv-rule-label">Rule 02</p>
            <h3>Shift-expired submissions are locked.</h3>
            <p>Once a shift window closes, the checklist becomes read-only. Late edits aren't possible — the audit trail stays clean.</p>
          </div>
        </div>
      </section>

      {/* — Tech stack ribbon — */}
      <section className="hv-stack">
        <div className="container">
          <p className="hv-stack-label">Built with</p>
          <div className="hv-stack-row">
            <span>React</span>
            <span>Vite</span>
            <span>Node.js</span>
            <span>Express</span>
            <span>Prisma</span>
            <span>MySQL</span>
            <span>JWT</span>
            <span>Swagger</span>
          </div>
        </div>
      </section>

      {/* — Demo credentials — */}
      <section id="demo" className="hv-section tinted">
        <div className="container">
          <p className="hv-section-eyebrow">Live demo</p>
          <h2 className="hv-section-title">Try it with seeded accounts.</h2>
          <p className="hv-section-intro">
            Pick a role — click Sign in to open the login screen with credentials pre-filled, or copy them manually.
          </p>
          <div className="hv-demo-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <article key={acc.role} className={`hv-demo-card ${acc.tint}`}>
                <div className="hv-demo-head">
                  <h3>{acc.name}</h3>
                  <span className="hv-demo-badge">{acc.role}</span>
                </div>
                <div className="hv-demo-field">
                  <label>Email</label>
                  <div className="hv-demo-value">
                    <code>{acc.email}</code>
                    <button type="button" onClick={() => copy(acc.email, `${acc.role}-e`)}>
                      {copied === `${acc.role}-e` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="hv-demo-field">
                  <label>Password</label>
                  <div className="hv-demo-value">
                    <code>{acc.password}</code>
                    <button type="button" onClick={() => copy(acc.password, `${acc.role}-p`)}>
                      {copied === `${acc.role}-p` ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <Link className="hv-btn-primary block" to={`/login?as=${acc.role}`}>
                  Sign in as {acc.name} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* — FAQ — */}
      <section id="faq" className="hv-section">
        <div className="container hv-faq-wrap">
          <div>
            <p className="hv-section-eyebrow">FAQ</p>
            <h2 className="hv-section-title">Common questions.</h2>
            <p className="hv-section-intro">Quick answers about how the system enforces the business rules and how to plug in.</p>
          </div>
          <div className="hv-faq-list">
            {FAQS.map((f, i) => (
              <button
                key={i}
                type="button"
                className={`hv-faq-item ${openFaq === i ? "open" : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              >
                <span className="hv-faq-q">
                  <span>{f.q}</span>
                  <span className="hv-faq-toggle">{openFaq === i ? "–" : "+"}</span>
                </span>
                {openFaq === i && <span className="hv-faq-a">{f.a}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* — Footer — */}
      <footer className="hv-footer">
        <div className="container hv-footer-grid">
          <div>
            <div className="hv-brand">
              <span className="hv-brand-mark">MCS</span>
              <span className="hv-brand-name">Maintenance Checklist System</span>
            </div>
            <p className="hv-footer-tag">Shift checklists, verified.</p>
          </div>
          <div>
            <h5>Product</h5>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#demo">Live demo</a>
          </div>
          <div>
            <h5>Resources</h5>
            <a href="http://localhost:5000/api-docs" target="_blank" rel="noreferrer">API docs (Swagger)</a>
            <a href="http://localhost:5000/api/health" target="_blank" rel="noreferrer">Health check</a>
            <a href="#faq">FAQ</a>
          </div>
          <div>
            <h5>For roles</h5>
            <Link to="/login?as=admin">Admin login</Link>
            <Link to="/login?as=staff">Staff login</Link>
            <Link to="/login?as=supervisor">Supervisor login</Link>
          </div>
        </div>
        <div className="hv-footer-bottom container">
          <span>© 2026 Maintenance Checklist System</span>
          <span className="hv-status"><span className="hv-status-dot" /> API target: localhost:5000</span>
        </div>
      </footer>
    </main>
  );
}

export default function App() {
  function roleHome(role) {
    if (role === "admin") return "/admin";
    if (role === "staff") return "/staff";
    if (role === "supervisor") return "/supervisor";
    return "/";
  }

  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("task_auth");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (auth?.token) {
      setAuthToken(auth.token);
      localStorage.setItem("task_auth", JSON.stringify(auth));
    } else {
      setAuthToken("");
      localStorage.removeItem("task_auth");
    }
  }, [auth]);

  async function onLogin(loginData) {
    setAuth(loginData);
  }

  function onLogout() {
    setAuth(null);
  }

  async function verifyAuth() {
    if (!auth?.token) return;
    try {
      await api.get("/auth/me");
    } catch {
      setAuth(null);
    }
  }

  useEffect(() => {
    verifyAuth();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          auth?.token ? (
            <Navigate to={roleHome(auth?.user?.role)} replace />
          ) : (
            <LoginPage onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/admin"
        element={
          auth?.user?.role === "admin" ? (
            <AdminPage auth={auth} onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/staff"
        element={
          auth?.user?.role === "staff" ? (
            <StaffPage auth={auth} onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/supervisor"
        element={
          auth?.user?.role === "supervisor" ? (
            <SupervisorPage auth={auth} onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
