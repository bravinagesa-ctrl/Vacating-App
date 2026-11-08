import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../lib/format";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.username, form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.status === 401 ? "Wrong username or password." : apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Log in</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="field" required autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="field" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-4 text-sm">New to Hama? <Link to="/register" className="font-semibold text-jacaranda-deep underline">Create an account</Link></p>
    </div>
  );
}
