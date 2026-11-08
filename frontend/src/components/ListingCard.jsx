import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatKES } from "../lib/format";
import { typeLabel } from "../lib/constants";

export default function ListingCard({ listing, active = false, onHover }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(listing.is_saved);
  const photo = listing.images?.[0]?.image;

  const toggleSave = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/listings/${listing.id}/save/`);
      setSaved(data.saved);
    } catch {
      /* ignore: the heart simply does not change */
    }
  };

  return (
    <Link
      to={`/listings/${listing.id}`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`flex gap-3 rounded-xl border bg-white p-2 ${active ? "border-jacaranda" : "border-line"}`}
    >
      {photo ? (
        <img src={photo} alt="" className="h-28 w-32 shrink-0 rounded-lg object-cover" loading="lazy" />
      ) : (
        <div className="grid h-28 w-32 shrink-0 place-items-center rounded-lg bg-jacaranda-mist text-sm text-jacaranda-deep">No photo yet</div>
      )}
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-lg font-bold leading-tight">{formatKES(listing.price_kes)}<span className="text-sm font-normal"> /month</span></p>
          {user && (
            <button onClick={toggleSave} aria-pressed={saved} className="rounded-md px-2 text-sm font-semibold text-jacaranda-deep hover:bg-jacaranda-mist">
              {saved ? "Saved" : "Save"}
            </button>
          )}
        </div>
        <p className="truncate font-semibold">{listing.title}</p>
        <p className="truncate text-sm text-ink/70">
          {listing.area?.name || listing.address_text || "Kenya"} · {typeLabel(listing.house_type)} · {listing.bedrooms} bed · {listing.bathrooms} bath
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
          {listing.is_verified && <span className="rounded bg-acacia px-1.5 py-0.5 text-white">Verified</span>}
          {listing.is_featured && <span className="rounded bg-matatu px-1.5 py-0.5 text-ink">Featured</span>}
          {listing.distance_km != null && <span className="rounded bg-jacaranda-mist px-1.5 py-0.5 text-jacaranda-deep">{listing.distance_km} km away</span>}
        </div>
      </div>
    </Link>
  );
}
