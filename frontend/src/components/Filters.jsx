import { AMENITIES, HOUSE_TYPES } from "../lib/constants";

/** Filters read from and write to the URL search params, so every search is shareable. */
export default function Filters({ params, update }) {
  const selected = (params.get("amenities") || "").split(",").filter(Boolean);

  const toggleAmenity = (value) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    update({ amenities: next.join(",") });
  };

  const priceInput = (name, label) => (
    <div className="flex-1">
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name}
        key={`${name}-${params.get(name) ?? ""}`}
        className="field"
        type="number"
        min="0"
        step="1000"
        inputMode="numeric"
        placeholder="KES"
        defaultValue={params.get(name) ?? ""}
        onBlur={(e) => update({ [name]: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && update({ [name]: e.currentTarget.value })}
      />
    </div>
  );

  return (
    <section aria-label="Filters" className="space-y-3 rounded-xl border border-line bg-white p-3">
      <div className="flex gap-2">
        {priceInput("min_price", "Min rent")}
        {priceInput("max_price", "Max rent")}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label" htmlFor="house_type">Type</label>
          <select id="house_type" className="field" value={params.get("house_type") || ""} onChange={(e) => update({ house_type: e.target.value })}>
            <option value="">Any</option>
            {HOUSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="min_bedrooms">Bedrooms</label>
          <select id="min_bedrooms" className="field" value={params.get("min_bedrooms") || ""} onChange={(e) => update({ min_bedrooms: e.target.value })}>
            <option value="">Any</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="radius_km">Distance</label>
          <select id="radius_km" className="field" value={params.get("radius_km") || "3"} onChange={(e) => update({ radius_km: e.target.value })}>
            {[1, 3, 5, 10, 20].map((n) => <option key={n} value={n}>{n} km</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">Must have</legend>
        <div className="flex flex-wrap gap-1.5">
          {AMENITIES.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-pressed={selected.includes(a.value)}
              onClick={() => toggleAmenity(a.value)}
              className={`chip ${selected.includes(a.value) ? "!border-jacaranda !bg-jacaranda !text-white" : ""}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={params.get("verified") === "true"} onChange={(e) => update({ verified: e.target.checked ? "true" : "" })} />
        Verified listings only
      </label>
    </section>
  );
}
