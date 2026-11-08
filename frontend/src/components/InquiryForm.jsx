import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { apiError } from "../lib/format";

export default function InquiryForm({ listingId }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.first_name || user?.username || "",
    phone: user?.phone ? `0${user.phone.slice(3)}` : "",
    message: "Hi, is this house still available? When can I view it?",
  });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: "", text: "" });
    try {
      const { data } = await api.post(`/listings/${listingId}/inquire/`, form);
      setStatus({ type: "ok", text: data.detail });
    } catch (err) {
      setStatus({ type: "error", text: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="inq-name">Your name</label>
        <input id="inq-name" className="field" required value={form.name} onChange={set("name")} />
      </div>
      <div>
        <label className="label" htmlFor="inq-phone">Your phone number</label>
        <input id="inq-phone" className="field" required inputMode="tel" placeholder="0712345678" value={form.phone} onChange={set("phone")} />
      </div>
      <div>
        <label className="label" htmlFor="inq-msg">Message</label>
        <textarea id="inq-msg" className="field" rows={3} required maxLength={1000} value={form.message} onChange={set("message")} />
      </div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
      {status.text && (
        <p role="status" className={`text-sm font-semibold ${status.type === "ok" ? "text-acacia" : "text-red-700"}`}>{status.text}</p>
      )}
    </form>
  );
}
