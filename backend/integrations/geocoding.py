import logging

import requests
from django.conf import settings
from django.core.cache import cache

log = logging.getLogger(__name__)
TIMEOUT = 8


def search(query):
    """Search places inside Kenya. Returns [{"label", "lat", "lng"}, ...]."""
    query = (query or "").strip()
    if len(query) < 2:
        return []
    provider = "google" if settings.GOOGLE_MAPS_API_KEY else "nominatim"
    cache_key = f"geocode:{provider}:{query.lower()}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        results = _google(query) if provider == "google" else _nominatim(query)
    except requests.RequestException:
        log.exception("Geocoding request failed")
        return []
    cache.set(cache_key, results, 60 * 60 * 24)
    return results


def _google(query):
    resp = requests.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={
            "address": query,
            "components": "country:KE",
            "region": "ke",
            "key": settings.GOOGLE_MAPS_API_KEY,
        },
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        log.warning("Google geocoding status: %s", data.get("status"))
        return []
    return [
        {
            "label": item["formatted_address"],
            "lat": item["geometry"]["location"]["lat"],
            "lng": item["geometry"]["location"]["lng"],
        }
        for item in data.get("results", [])[:6]
    ]


def _nominatim(query):
    resp = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": query, "format": "json", "countrycodes": "ke", "limit": 6},
        headers={"User-Agent": settings.NOMINATIM_USER_AGENT},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return [
        {"label": item["display_name"], "lat": float(item["lat"]), "lng": float(item["lon"])}
        for item in resp.json()
    ]
