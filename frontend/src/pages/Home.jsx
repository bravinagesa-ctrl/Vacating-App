import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import MapView from "../components/MapView";
import PlaceSearch from "../components/PlaceSearch";
import { NAIROBI } from "../lib/constants";

export default function Home() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    api.get("/listings/").then((r) => setListings(r.data.results)).catch(() => {});
    api.get("/areas/").then((r) => setAreas(r.data)).catch(() => {});
  }, []);

  const goTo = ({ label, lat, lng }) =>
    navigate(`/search?lat=${lat}&lng=${lng}&label=${encodeURIComponent(label)}`);

  return (
    <div className="relative h-[calc(100vh-56px)] min-h-[560px]">
      <div className="absolute inset-0 isolate z-0">
        <MapView center={NAIROBI} zoom={12} listings={listings} onSelect={(id) => navigate(`/listings/${id}`)} scrollWheelZoom={false} />
      </div>

      <section className="panel-in glass absolute left-3 right-3 top-3 z-10 rounded-2xl p-5 sm:left-8 sm:right-auto sm:top-8 sm:w-[440px] sm:p-6" aria-labelledby="hero-title">
        <h1 id="hero-title" className="font-display text-3xl font-bold leading-tight text-jacaranda-deep sm:text-4xl">
          Moving to a new area? See it before you go.
        </h1>
        <p className="mt-2 text-ink/80">
          Search an estate or landmark anywhere in Kenya. Compare rent, water, security, transport and internet for the area, then message the landlord.
        </p>
        <div className="mt-4">
          <PlaceSearch onSelect={goTo} placeholder="Try Uthiru, Ruaka or Syokimau" />
        </div>
        {areas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {areas.slice(0, 8).map((a) => (
              <Link key={a.id} className="chip hover:bg-jacaranda-mist" to={`/search?lat=${a.lat}&lng=${a.lng}&label=${encodeURIComponent(a.name)}&radius_km=3`}>
                {a.name}
              </Link>
            ))}
          </div>
        )}
        <p className="mt-4 text-sm">
          Own or manage houses? <Link to="/register" className="font-semibold text-jacaranda-deep underline">List them on Hama</Link>.
        </p>
      </section>
    </div>
  );
}
