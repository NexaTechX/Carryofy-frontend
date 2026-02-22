/**
 * Geocode delivery addresses to real coordinates for shipping distance/fee calculation.
 * Uses OpenStreetMap Nominatim (free, no API key). See: https://nominatim.org/release-docs/develop/api/Search/
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export interface GeocodeAddressInput {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Carryofy/1.0 (delivery address geocoding)';

/**
 * Build a single query string from address parts for Nominatim search.
 */
function buildQuery(input: GeocodeAddressInput): string {
  const parts = [
    input.line1?.trim(),
    input.line2?.trim(),
    input.city?.trim(),
    input.state?.trim(),
    input.country?.trim() || 'Nigeria',
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Geocode an address to latitude/longitude using OpenStreetMap Nominatim.
 * Used so we can calculate delivery distance and shipping fee from the user's real location.
 * Returns null if the address could not be geocoded (shipping service will use fallback distance).
 */
export async function geocodeAddress(input: GeocodeAddressInput): Promise<GeocodeResult | null> {
  const query = buildQuery(input);
  if (!query.trim()) return null;

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '0',
  });

  try {
    const res = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode: convert latitude/longitude to address components.
 * Uses OpenStreetMap Nominatim reverse geocoding.
 * Returns address parts for auto-filling forms, or null if lookup fails.
 */
export interface ReverseGeocodeResult {
  line1: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
    'accept-language': 'en',
  });

  try {
    const res = await fetch(`${NOMINATIM_REVERSE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr || typeof addr !== 'object') return null;

    const road = addr.road || addr.street || addr.pedestrian || '';
    const house = addr.house_number || addr.house_name || '';
    const line1 = [house, road].filter(Boolean).join(' ').trim() || data.display_name?.split(',')[0]?.trim() || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const state = addr.state || addr.region || '';
    const country = addr.country || 'Nigeria';
    const postalCode = addr.postcode || undefined;

    return {
      line1: line1 || city || state || country || 'Address',
      city: city || state || country || '',
      state: state || '',
      country,
      postalCode,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return null;
  }
}

/**
 * Get the user's current position via browser Geolocation API (optional, for "Use my location").
 * Returns { latitude, longitude } or null if denied/unsupported.
 */
export function getCurrentPosition(): Promise<GeocodeResult | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
