import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { formatKESShort } from "../lib/format";
import { NAIROBI } from "../lib/constants";

const TILE_URL = import.meta.env.VITE_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function priceIcon(listing, active) {
  const classes = ["price-pin", active && "price-pin--active", listing.is_featured && "price-pin--featured"]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    className: "",
    html: `<div class="${classes}">${formatKESShort(listing.price_kes)}</div>`,
    iconSize: [64, 28],
    iconAnchor: [32, 28],
  });
}

const dropIcon = L.divIcon({
  className: "",
  html: '<div class="drop-pin"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [center?.[0], center?.[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function BoundsReporter({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBoundsChange?.(`${b.getWest().toFixed(5)},${b.getSouth().toFixed(5)},${b.getEast().toFixed(5)},${b.getNorth().toFixed(5)}`);
    },
  });
  return null;
}

/** Map with price pins. Pass `origin` [lat,lng] and `radiusKm` to show the search circle. */
export default function MapView({
  center = NAIROBI,
  zoom = 13,
  listings = [],
  selectedId = null,
  onSelect,
  onBoundsChange,
  origin = null,
  radiusKm = null,
  className = "h-full w-full",
  scrollWheelZoom = true,
}) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} scrollWheelZoom={scrollWheelZoom}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Recenter center={center} zoom={zoom} />
      {onBoundsChange && <BoundsReporter onBoundsChange={onBoundsChange} />}
      {origin && radiusKm && (
        <Circle center={origin} radius={radiusKm * 1000} pathOptions={{ color: "#5B3E96", weight: 1.5, fillOpacity: 0.06 }} />
      )}
      {origin && <Marker position={origin} icon={dropIcon} />}
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={priceIcon(listing, listing.id === selectedId)}
          zIndexOffset={listing.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect?.(listing.id) }}
        />
      ))}
    </MapContainer>
  );
}

function ClickToPick({ onChange }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Click the map to drop a pin. `value` is {lat, lng} or null. */
export function PinPicker({ value, onChange, center = NAIROBI }) {
  const position = value ? [value.lat, value.lng] : null;
  return (
    <MapContainer center={position || center} zoom={position ? 16 : 12} className="h-64 w-full rounded-lg border border-line">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ClickToPick onChange={onChange} />
      {position && <Recenter center={position} />}
      {position && <Marker position={position} icon={dropIcon} />}
    </MapContainer>
  );
}
