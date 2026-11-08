import { useEffect, useId, useRef, useState } from "react";
import api from "../api/client";

/** Type a place, estate or landmark in Kenya and pick a result. Calls onSelect({label, lat, lng}). */
export default function PlaceSearch({ onSelect, placeholder = "Search an area, estate or landmark", initial = "" }) {
  const [text, setText] = useState(initial);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const skipNext = useRef(false);
  const listId = useId();

  useEffect(() => setText(initial), [initial]);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    if (text.trim().length < 3) {
      setResults([]);
      setMessage("");
      return;
    }
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const { data } = await api.get("/geocode/", { params: { q: text.trim() } });
        setResults(data);
        setMessage(data.length ? "" : "No places found. Try a nearby estate or a landmark.");
        setOpen(true);
      } catch {
        setMessage("Place search is unavailable right now.");
        setOpen(true);
      } finally {
        setBusy(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [text]);

  const choose = (place) => {
    skipNext.current = true;
    setText(place.label.split(",").slice(0, 2).join(","));
    setOpen(false);
    onSelect(place);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setMessage("Your browser cannot share its location.");
    navigator.geolocation.getCurrentPosition(
      (pos) => choose({ label: "My location", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setMessage("Location access was blocked. Search for an area instead.");
        setOpen(true);
      }
    );
  };

  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`${listId}-input`}>Search places</label>
      <div className="flex gap-2">
        <input
          id={`${listId}-input`}
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
        />
        <button type="button" className="btn-ghost shrink-0" onClick={useMyLocation} title="Use my location">
          Near me
        </button>
      </div>
      {busy && <p className="mt-1 text-sm text-ink/60">Searching…</p>}
      {open && (results.length > 0 || message) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[1100] mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg"
        >
          {results.map((place) => (
            <li key={`${place.lat},${place.lng},${place.label}`} role="option">
              <button type="button" className="w-full px-3 py-2 text-left hover:bg-jacaranda-mist" onClick={() => choose(place)}>
                {place.label}
              </button>
            </li>
          ))}
          {message && <li className="px-3 py-2 text-sm text-ink/70">{message}</li>}
        </ul>
      )}
    </div>
  );
}
