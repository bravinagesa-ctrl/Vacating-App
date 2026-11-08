import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import InquiryForm from "../components/InquiryForm";
import MapView from "../components/MapView";
import { amenityLabel, typeLabel } from "../lib/constants";
import { formatKES } from "../lib/format";

function Score({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-line" role="presentation">
        <div className="h-2 rounded-full bg-acacia" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    setListing(null);
    api
      .get(`/listings/${id}/`)
      .then((r) => setListing(r.data))
      .catch((e) => setError(e.response?.status === 404 ? "This listing no longer exists." : "Could not load this listing."));
  }, [id]);

  if (error) return <p className="p-8 text-center font-semibold">{error} <Link className="text-jacaranda-deep underline" to="/search">Back to search</Link></p>;
  if (!listing) return <p className="p-8">Loading…</p>;

  const area = listing.area;
  const whatsapp = listing.contact_phone
    ? `https://wa.me/${listing.contact_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I saw "${listing.title}" on Hama. Is it still available?`)}`
    : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          {listing.images.length > 0 ? (
            <>
              <img src={listing.images[photo].image} alt={`${listing.title}, photo ${photo + 1}`} className="aspect-[16/10] w-full rounded-xl object-cover" />
              {listing.images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {listing.images.map((img, i) => (
                    <button key={img.id} onClick={() => setPhoto(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === photo}>
                      <img src={img.image} alt="" className={`h-16 w-24 rounded-md object-cover ${i === photo ? "ring-2 ring-jacaranda" : ""}`} />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid aspect-[16/10] place-items-center rounded-xl bg-jacaranda-mist text-jacaranda-deep">The landlord has not added photos yet</div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {listing.is_verified && <span className="rounded bg-acacia px-2 py-0.5 text-sm font-semibold text-white">Verified</span>}
            {listing.is_featured && <span className="rounded bg-matatu px-2 py-0.5 text-sm font-semibold">Featured</span>}
            {!listing.is_available && <span className="rounded bg-ink px-2 py-0.5 text-sm font-semibold text-white">No longer available</span>}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{listing.title}</h1>
          <p className="text-lg">{typeLabel(listing.house_type)} · {listing.bedrooms} bed · {listing.bathrooms} bath · {area?.name || listing.address_text}</p>
          <p className="mt-2 font-display text-3xl font-bold text-jacaranda-deep">{formatKES(listing.price_kes)}<span className="text-base font-normal"> /month</span></p>
          {listing.description && <p className="mt-4 max-w-prose whitespace-pre-line">{listing.description}</p>}
          {listing.amenities.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {listing.amenities.map((a) => <li key={a} className="chip">{amenityLabel(a)}</li>)}
            </ul>
          )}
        </div>

        <div className="h-72 overflow-hidden rounded-xl border border-line isolate z-0 relative">
          <MapView center={[listing.lat, listing.lng]} zoom={15} listings={[listing]} selectedId={listing.id} scrollWheelZoom={false} />
        </div>

        {area && (
          <section className="rounded-xl border border-line bg-white p-5" aria-labelledby="area-title">
            <h2 id="area-title" className="font-display text-xl font-bold">Living in {area.name}</h2>
            {area.description && <p className="mt-1 max-w-prose">{area.description}</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Score label="Water supply" value={area.water_score} />
              <Score label="Security" value={area.security_score} />
              <Score label="Transport" value={area.transport_score} />
              <Score label="Internet" value={area.internet_score} />
            </div>
            {area.nearest_stage && <p className="mt-4 text-sm"><span className="font-semibold">Matatu stage:</span> {area.nearest_stage}</p>}
            <Link className="mt-3 inline-block font-semibold text-jacaranda-deep underline" to={`/search?lat=${area.lat}&lng=${area.lng}&label=${encodeURIComponent(area.name)}`}>
              See all homes in {area.name}
            </Link>
          </section>
        )}
      </div>

      <aside className="h-fit space-y-4 rounded-xl border border-line bg-white p-5 lg:sticky lg:top-20">
        <h2 className="font-display text-xl font-bold">Contact {listing.owner_name}</h2>
        {listing.contact_phone && (
          <div className="flex gap-2">
            <a className="btn-primary flex-1" href={`tel:+${listing.contact_phone}`}>Call</a>
            {whatsapp && <a className="btn-ghost flex-1" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          </div>
        )}
        <InquiryForm listingId={listing.id} />
        <p className="text-xs text-ink/60">Never pay a viewing fee or deposit before you have seen the house and met the landlord.</p>
      </aside>
    </div>
  );
}
