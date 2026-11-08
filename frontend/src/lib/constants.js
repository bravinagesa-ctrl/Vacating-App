export const NAIROBI = [-1.2921, 36.8219];

export const HOUSE_TYPES = [
  { value: "single_room", label: "Single room" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "maisonette", label: "Maisonette" },
  { value: "bungalow", label: "Bungalow" },
  { value: "townhouse", label: "Townhouse" },
];

export const AMENITIES = [
  { value: "water", label: "Reliable water" },
  { value: "backup_water", label: "Borehole or tank" },
  { value: "parking", label: "Parking" },
  { value: "security", label: "24h security" },
  { value: "gated", label: "Gated compound" },
  { value: "cctv", label: "CCTV" },
  { value: "wifi", label: "Fibre ready" },
  { value: "balcony", label: "Balcony" },
  { value: "dsq", label: "DSQ" },
  { value: "tiled", label: "Tiled floors" },
];

export const typeLabel = (value) => HOUSE_TYPES.find((t) => t.value === value)?.label ?? value;
export const amenityLabel = (value) => AMENITIES.find((a) => a.value === value)?.label ?? value;
