import { useEffect, useState } from "react";
import { isCancel } from "axios";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import Filters from "../components/Filters";
import ListingCard from "../components/ListingCard";
import MapView from "../components/MapView";
import PlaceSearch from "../components/PlaceSearch";
import { NAIROBI } from "../lib/constants";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ count: 0, results: [], next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoverId, setHoverId] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  const lat = parseFloat(params.get("lat"));
  const lng = parseFloat(params.get("lng"));
  const hasOrigin = Number.isFinite(lat) && Number.isFinite(lng);
  const radius = Number(params.get("radius_km") || 3);
  const page = Number(params.get("page") || 1);
  const query = params.toString();

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const q = new URLSearchParams(params);
    q.delete("label");
    api
      .get(`/listings/?${q.toString()}`, { signal: controller.signal })
      .then((r) => setData(r.data))
      .catch((e) => {
        if (!isCancel(e)) setError("We could not load listings. Check your connection and try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const center = hasOrigin ? [lat, lng] : data.results[0] ? [data.results[0].lat, data.results[0].lng] : NAIROBI;
  const searchThisArea = () => update({ bbox: bounds, lat: "", lng: "", label: "" });

  return (
    <div className="grid min-h-[calc(100vh-56px)] lg:grid-cols-[minmax(380px,520px)_1fr]">
      <section className={`space-y-3 p-3 lg:h-[calc(100vh-56px)] lg:overflow-y-auto ${mobileView === "map" ? "hidden lg:block" : ""}`}>
        <PlaceSearch
          initial={params.get("label") || ""}
          onSelect={({ label, lat, lng }) => update({ lat, lng, label, bbox: "" })}
        />
        <Filters params={params} update={update} />

        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">
            {loading ? "Searching…" : `${data.count} ${data.count === 1 ? "home" : "homes"}`}
            {params.get("label") ? ` near ${params.get("label").split(",")[0]}` : ""}
          </h1>
          <button className="btn-ghost py-1 lg:hidden" onClick={() => setMobileView("map")}>Show map</button>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
        {!loading && !error && data.results.length === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-white p-6 text-center">
            <p className="font-semibold">No homes match yet.</p>
            <p className="text-sm text-ink/70">Try a larger distance, a higher budget, or fewer must-haves.</p>
          </div>
        )}

        <div className="space-y-2">
          {data.results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} active={hoverId === listing.id} onHover={setHoverId} />
          ))}
        </div>

        {(data.previous || data.next) && (
          <div className="flex items-center justify-between pb-6">
            <button className="btn-ghost" disabled={!data.previous} onClick={() => update({ page: page - 1 })}>Previous</button>
            <span className="text-sm">Page {page}</span>
            <button className="btn-ghost" disabled={!data.next} onClick={() => update({ page: page + 1 })}>Next</button>
          </div>
        )}
      </section>

      <section className={`relative isolate z-0 h-[calc(100vh-56px)] ${mobileView === "list" ? "hidden lg:block" : ""}`}>
        <MapView
          center={center}
          zoom={hasOrigin ? 14 : 12}
          listings={data.results}
          selectedId={hoverId}
          onSelect={setHoverId}
          onBoundsChange={setBounds}
          origin={hasOrigin ? [lat, lng] : null}
          radiusKm={hasOrigin ? radius : null}
        />
        <div className="absolute left-1/2 top-3 z-[500] flex -translate-x-1/2 gap-2">
          <button className="glass btn rounded-full px-4 py-1.5 text-sm" onClick={searchThisArea} disabled={!bounds}>
            Search this area
          </button>
          <button className="glass btn rounded-full px-4 py-1.5 text-sm lg:hidden" onClick={() => setMobileView("list")}>
            Show list
          </button>
        </div>
      </section>
    </div>
  );
}
