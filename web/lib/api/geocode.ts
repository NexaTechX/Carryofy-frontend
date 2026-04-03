/**
 * Geocode delivery addresses to real coordinates for shipping distance/fee calculation.
 * Uses OpenStreetMap Nominatim (free, no API key). See: https://nominatim.org/release-docs/develop/api/Search/
 */

import { getApiBaseUrl } from './utils';

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

export interface GeocodeOptions {
  preferServer?: boolean;
  accessToken?: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Carryofy/1.0 (delivery address geocoding)';
const BASE_HEADERS: Record<string, string> = {
  Accept: 'application/json',
};

function getRequestHeaders(): Record<string, string> {
  // Browsers block custom User-Agent; keep it for non-browser runtimes.
  if (typeof window !== 'undefined') return BASE_HEADERS;
  return { ...BASE_HEADERS, 'User-Agent': USER_AGENT };
}

function parseGeocodePayload(data: unknown): GeocodeResult | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] as { lat?: string; lon?: string };
  const lat = parseFloat(first.lat ?? '');
  const lon = parseFloat(first.lon ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: lat, longitude: lon };
}

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, ' ').replace(/\n+/g, ', ').trim();
}

function buildQueryCandidates(rawQuery: string): string[] {
  const normalized = normalizeQuery(rawQuery);
  if (!normalized) return [];
  const hasNigeria = /\bnigeria\b/i.test(normalized);
  const candidates = [normalized];
  if (!hasNigeria) candidates.push(`${normalized}, Nigeria`);
  return Array.from(new Set(candidates));
}

async function fetchGeocode(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    addressdetails: '0',
    'accept-language': 'en',
  });

  try {
    const res = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return parseGeocodePayload(data);
  } catch {
    return null;
  }
}

async function fetchServerGeocode(
  query: string,
  accessToken: string
): Promise<GeocodeResult | null> {
  const apiUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiUrl}/location/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const candidate = payload?.data ?? payload;
    const latitude = Number(candidate?.latitude);
    const longitude = Number(candidate?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

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
  return geocodeString(query);
}

/**
 * Geocode a single address string to latitude/longitude.
 */
export async function geocodeString(
  query: string,
  options: GeocodeOptions = {}
): Promise<GeocodeResult | null> {
  const queries = buildQueryCandidates(query);
  if (queries.length === 0) return null;

  if (options.preferServer && options.accessToken) {
    for (const candidate of queries) {
      const resolved = await fetchServerGeocode(candidate, options.accessToken);
      if (resolved) return resolved;
    }
  }

  for (const candidate of queries) {
    const resolved = await fetchGeocode(candidate);
    if (resolved) return resolved;
  }

  return null;
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
      headers: getRequestHeaders(),
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
