import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

const DEMO_PREFILL = {
  admin: { email: "admin@example.com", password: "Admin@123" },
  staff: { email: "staff@example.com", password: "Staff@123" },
  supervisor: { email: "supervisor@example.com", password: "Supervisor@123" },
};

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = DEMO_PREFILL[params.get("as")] || DEMO_PREFILL.admin;
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const authData = response.data.data;
      onLogin(authData);
      const role = authData?.user?.role;
      const target =
        role === "admin"
          ? "/admin"
          : role === "staff"
            ? "/staff"
            : role === "supervisor"
              ? "/supervisor"
              : "/";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo">MCS</div>
          <h1>Maintenance Checklist System</h1>
          <p className="muted">Sign in to continue</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
