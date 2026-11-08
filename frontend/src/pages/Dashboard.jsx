import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import ListingCard from "../components/ListingCard";
import { PinPicker } from "../components/MapView";
import { useAuth } from "../context/AuthContext";
import { AMENITIES, HOUSE_TYPES } from "../lib/constants";
import { apiError } from "../lib/format";

/* ---------- Pay to feature a listing (M-Pesa STK push) ---------- */
function FeatureModal({ listing, defaultPhone, onClose, onDone }) {
  const [phone, setPhone] = useState(defaultPhone ? `0${defaultPhone.slice(3)}` : "");
  const [state, setState] = useState({ step: "form", text: "" });

  const pay = async (e) => {
    e.preventDefault();
    setState({ step: "waiting", text: "Check your phone and enter your M-Pesa PIN." });
    try {
      const { data } = await api.post("/payments/mpesa/stk/", { listing_id: listing.id, phone });
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const { data: payment } = await api.get(`/payments/${data.id}/`);
        if (payment.status === "success") {
          setState({ step: "done", text: `Paid. Receipt ${payment.mpesa_receipt}. Your listing is now featured.` });
          onDone();
          return;
        }
        if (payment.status === "failed") {
          setState({ step: "form", text: payment.result_desc || "The payment was not completed." });
          return;
        }
      }
      setState({ step: "form", text: "We did not get a confirmation. If M-Pesa charged you, refresh in a minute." });
    } catch (err) {
      setState({ step: "form", text: apiError(err) });
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pay-title">
      <form onSubmit={pay} className="w-full max-w-sm space-y-3 rounded-xl bg-white p-5">
        <h2 id="pay-title" className="font-display text-xl font-bold">Feature this listing</h2>
        <p className="text-sm">"{listing.title}" appears first in search results with a gold pin. Pay with M-Pesa.</p>
        <div>
          <label className="label" htmlFor="pay-phone">M-Pesa number</label>
          <input id="pay-phone" className="field" required inputMode="tel" placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={state.step !== "form"} />
        </div>
        {state.text && <p role="status" className={`text-sm font-semibold ${state.step === "done" ? "text-acacia" : "text-ink"}`}>{state.text}</p>}
        <div className="flex gap-2">
          {state.step !== "done" && <button className="btn-primary flex-1" disabled={state.step === "waiting"}>{state.step === "waiting" ? "Waiting…" : "Pay with M-Pesa"}</button>}
          <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={state.step === "waiting"}>{state.step === "done" ? "Close" : "Cancel"}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- New listing form ---------- */
function NewListingForm({ onCreated }) {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", house_type: "apartment", price_kes: "", bedrooms: 1, bathrooms: 1,
    area_id: "", address_text: "", amenities: [],
  });
  const [pin, setPin] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/areas/").then((r) => setAreas(r.data)).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleAmenity = (value) =>
    setForm({ ...form, amenities: form.amenities.includes(value) ? form.amenities.filter((a) => a !== value) : [...form.amenities, value] });

  const submit = async (e) => {
    e.preventDefault();
    if (!pin) return setError("Click the map to drop a pin on the house location.");
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        price_kes: Number(form.price_kes),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area_id: form.area_id ? Number(form.area_id) : null,
        latitude: pin.lat,
        longitude: pin.lng,
      };
      const { data: listing } = await api.post("/listings/", payload);
      for (const file of Array.from(files).slice(0, 8)) {
        const fd = new FormData();
        fd.append("image", file);
        await api.post(`/listings/${listing.id}/images/`, fd);
      }
      onCreated();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-white p-5">
      <h2 className="font-display text-xl font-bold">New listing</h2>
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" className="field" required maxLength={160} placeholder="Spacious 2 bedroom near Uthiru stage" value={form.title} onChange={set("title")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="house_type">Type</label>
          <select id="house_type" className="field" value={form.house_type} onChange={set("house_type")}>
            {HOUSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="price">Rent per month (KES)</label>
          <input id="price" className="field" type="number" min="1" required value={form.price_kes} onChange={set("price_kes")} />
        </div>
        <div>
          <label className="label" htmlFor="beds">Bedrooms</label>
          <input id="beds" className="field" type="number" min="0" max="20" required value={form.bedrooms} onChange={set("bedrooms")} />
        </div>
        <div>
          <label className="label" htmlFor="baths">Bathrooms</label>
          <input id="baths" className="field" type="number" min="0" max="20" required value={form.bathrooms} onChange={set("bathrooms")} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="area">Area</label>
          <select id="area" className="field" value={form.area_id} onChange={set("area_id")}>
            <option value="">Not listed yet</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="address">Estate, road or landmark</label>
          <input id="address" className="field" placeholder="Off Naivasha Road, near Uthiru market" value={form.address_text} onChange={set("address_text")} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="desc">Description</label>
        <textarea id="desc" className="field" rows={4} value={form.description} onChange={set("description")} />
      </div>
      <fieldset>
        <legend className="label">Amenities</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <label key={a.value} className="chip cursor-pointer gap-2">
              <input type="checkbox" checked={form.amenities.includes(a.value)} onChange={() => toggleAmenity(a.value)} />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <p className="label">Location: click the map to place the pin</p>
        <div className="relative isolate z-0"><PinPicker value={pin} onChange={setPin} /></div>
      </div>
      <div>
        <label className="label" htmlFor="photos">Photos (up to 8, 5 MB each)</label>
        <input id="photos" type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</button>
    </form>
  );
}

/* ---------- Dashboard page ---------- */
export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [error, setError] = useState("");
  const canPost = user.can_post_listings;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(canPost ? "/listings/mine/" : "/listings/saved/");
      setItems(data.results);
    } catch {
      setError("Could not load your listings.");
    } finally {
      setLoading(false);
    }
  }, [canPost]);

  useEffect(() => { load(); }, [load]);

  const toggleAvailable = async (listing) => {
    await api.patch(`/listings/${listing.id}/`, { is_available: !listing.is_available });
    load();
  };

  const remove = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    await api.delete(`/listings/${listing.id}/`);
    load();
  };

  if (!canPost) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Saved homes</h1>
        {loading && <p>Loading…</p>}
        {!loading && items.length === 0 && (
          <p>You have not saved any homes yet. <Link className="font-semibold text-jacaranda-deep underline" to="/search">Search for a home</Link> and tap Save.</p>
        )}
        {items.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">My listings</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? "Close form" : "Add a listing"}</button>
      </div>

      {showForm && <NewListingForm onCreated={() => { setShowForm(false); load(); }} />}

      {error && <p role="alert" className="text-red-700">{error}</p>}
      {loading && <p>Loading…</p>}
      {!loading && items.length === 0 && !showForm && <p>You have no listings yet. Add your first one to start getting messages.</p>}

      <div className="space-y-3">
        {items.map((l) => (
          <div key={l.id} className="space-y-2 rounded-xl border border-line bg-white p-3">
            <ListingCard listing={l} />
            <div className="flex flex-wrap items-center gap-2 px-1 text-sm">
              <span className="font-semibold">{l.is_available ? "Visible in search" : "Hidden from search"}</span>
              {!l.is_verified && <span className="text-ink/60">Waiting for verification</span>}
              <span className="flex-1" />
              <button className="btn-ghost py-1" onClick={() => toggleAvailable(l)}>{l.is_available ? "Mark as let" : "Mark available"}</button>
              <button className="btn-ghost py-1" onClick={() => setPayFor(l)}>{l.is_featured ? "Extend feature" : "Feature this listing"}</button>
              <button className="btn-ghost py-1 !text-red-700" onClick={() => remove(l)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {payFor && (
        <FeatureModal listing={payFor} defaultPhone={user.phone} onClose={() => setPayFor(null)} onDone={load} />
      )}
    </div>
  );
}
