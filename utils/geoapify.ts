/**
 * utils/geoapify.ts
 *
 * Handles reverse geocoding (lat/lng -> readable place name) and static
 * map image URLs for the "Where did you find it?" pin on Create Post.
 *
 * Required env var:
 *   EXPO_PUBLIC_GEOAPIFY_API_KEY
 */

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

if (!GEOAPIFY_API_KEY) {
  console.warn("[geoapify] Missing EXPO_PUBLIC_GEOAPIFY_API_KEY in your .env");
}

export type ReverseGeocodeResult = {
  formatted: string; // full readable address
  city: string | null;
  state: string | null; // province, e.g. "Batangas"
  country: string | null;
};

/** Fetches a reverse-geocode URL and returns its first result (or null). */
async function fetchFirstResult(url: string): Promise<any | null> {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? "Geoapify reverse geocode failed");
  }

  return data?.results?.[0] ?? null;
}

/**
 * Converts a lat/lng pin into a readable location string, e.g.
 * "Lipa City, Batangas". Call this ONCE when the pin is placed/confirmed
 * on Create Post, then store the result in posts.location_name so the
 * feed never has to re-geocode on every render.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify is not configured. Check your .env file.");
  }

  const base =
    `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}` +
    `&format=json&apiKey=${GEOAPIFY_API_KEY}`;

  // `type=city` asks Geoapify for the city/municipality ADMIN area the
  // coordinates fall inside. Without it Geoapify matches the nearest
  // street/POI and fills `city`/`county` from that POI's own address tags
  // (addr:city), which is often a neighbouring city near city limits — a
  // pin in Brgy. San Felipe, Padre Garcia was reported as "Lipa, Batangas".
  let result = await fetchFirstResult(`${base}&type=city`);

  if (!result?.city && !result?.county) {
    // The city-level lookup didn't yield a usable locality (open water,
    // unincorporated area, ...) — try a normal nearest-address reverse
    // lookup, keeping the city-level result if that one is empty too.
    result = (await fetchFirstResult(base)) ?? result;
  }

  if (!result) {
    return { formatted: "Unknown location", city: null, state: null, country: null };
  }

  // Prefer "City, Province" (e.g. "Lipa City, Batangas") over the full
  // street-level address, since that matches the Community Feed pin label.
  const city = result.city ?? result.county ?? null;
  const state = result.state ?? null;
  const formatted =
    city && state ? `${city}, ${state}` : result.formatted ?? "Unknown location";

  return {
    formatted,
    city,
    state,
    country: result.country ?? null,
  };
}

/**
 * Tile URL template for react-native-maps' <UrlTile> component — this is
 * what actually renders the Geoapify basemap underneath the native MapView
 * (react-native-maps handles the pan/zoom/tap gestures; Geoapify just
 * supplies the tile images).
 *
 * Usage:
 *   <UrlTile urlTemplate={getGeoapifyTileUrlTemplate()} maximumZ={19} />
 */
export function getGeoapifyTileUrlTemplate(
  style: string = "osm-bright"
): string {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify is not configured. Check your .env file.");
  }

  return `https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`;
}

/**
 * Builds a Geoapify Static Maps image URL centered on a pin — useful if
 * Create Post/Post cards show a flat map image instead of an interactive
 * map component.
 */
export function buildStaticMapUrl(
  latitude: number,
  longitude: number,
  options?: { width?: number; height?: number; zoom?: number }
): string {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify is not configured. Check your .env file.");
  }

  const width = options?.width ?? 400;
  const height = options?.height ?? 300;
  const zoom = options?.zoom ?? 14;

  const marker = `lonlat:${longitude},${latitude};type:awesome;color:%231B4332;icon:leaf`;

  return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${longitude},${latitude}&zoom=${zoom}&marker=${marker}&apiKey=${GEOAPIFY_API_KEY}`;
}

/**
 * Optional: forward geocoding for a search bar if you ever let users type
 * a place name instead of dropping a pin manually.
 */
export async function searchPlace(query: string): Promise<
  { formatted: string; latitude: number; longitude: number }[]
> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify is not configured. Check your .env file.");
  }

  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
    query
  )}&filter=countrycode:ph&apiKey=${GEOAPIFY_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? "Geoapify search failed");
  }

  return (data?.results ?? []).map((r: any) => ({
    formatted: r.formatted,
    latitude: r.lat,
    longitude: r.lon,
  }));
}

export type RouteResult = {
  // GeoJSON MultiLineString geometry — pass straight into a MapLibre
  // <ShapeSource shape={...}> to draw the route line.
  geometry: { type: "MultiLineString"; coordinates: number[][][] };
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Gets a real, road/path-following walking route between two points via
 * Geoapify's Routing API. Costs 1 credit per leg — a simple two-point
 * route (like this one) is 1 credit per call.
 *
 * Used by the Map screen's "Get Directions" action.
 */
export async function getWalkingRoute(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
): Promise<RouteResult> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify is not configured. Check your .env file.");
  }

  const waypoints = `${fromLatitude},${fromLongitude}|${toLatitude},${toLongitude}`;
  const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=walk&apiKey=${GEOAPIFY_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? "Geoapify routing failed");
  }

  const feature = data?.features?.[0];

  if (!feature) {
    throw new Error("No route found between those points.");
  }

  return {
    geometry: feature.geometry,
    distanceMeters: feature.properties.distance,
    durationSeconds: feature.properties.time,
  };
}