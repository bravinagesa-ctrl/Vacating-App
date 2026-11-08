import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../lib/format";

const ROLES = [
  { value: "tenant", label: "I am looking for a home" },
  { value: "landlord", label: "I own houses to let" },
  { value: "agent", label: "I am an agent or caretaker" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", first_name: "", phone: "", password: "", role: "tenant" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const needsPhone = form.role !== "tenant";

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <fieldset>
          <legend className="label">I am…</legend>
          <div className="space-y-1">
            {ROLES.map((r) => (
              <label key={r.value} className="flex items-center gap-2">
                <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set("role")} />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="first_name">Your name</label>
          <input id="first_name" className="field" required value={form.first_name} onChange={set("first_name")} />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="field" required autoComplete="username" value={form.username} onChange={set("username")} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="field" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone {needsPhone ? "(tenants will call or message this number)" : "(optional)"}</label>
          <input id="phone" className="field" inputMode="tel" placeholder="0712345678" required={needsPhone} value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password (8 or more characters)</label>
          <input id="password" className="field" type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={set("password")} />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link to="/login" className="font-semibold text-jacaranda-deep underline">Log in</Link></p>
    </div>
  );
}
