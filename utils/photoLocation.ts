/**
 * utils/photoLocation.ts
 *
 * One place for the "where was this photo taken?" plumbing shared by the
 * Scan → Scanning → Scan Result → Create Post flow.
 *
 * The location always comes from the PHOTO itself, never from the device
 * at post time:
 *   • camera  → the GPS fix taken at the moment the shutter fired
 *   • gallery → whatever EXIF GPS the file already carries
 * so a post made days later still pins the original spot.
 *
 * All of this is local work — reading EXIF never touches the network.
 */
import * as Location from "expo-location";
export type PhotoCoords = { latitude: number; longitude: number };

/**
 * Bounding the GPS wait so a bad fix can't stall the flow. A cold lock
 * indoors can otherwise take far longer than a user will wait.
 */
const LOCATION_TIMEOUT_MS = 8000;

/**
 * Fresh GPS fix for where the device is right now — i.e. where the photo
 * was taken, when called straight after the shutter. Bounded, with the
 * last known position as a cheap fallback. Returns null when location
 * permission is off, location services are disabled, or no fix arrives in
 * time — callers treat that as "this photo has no location".
 */
export async function getCaptureLocation(): Promise<PhotoCoords | null> {
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
    ]);
    if (position) {
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    }
  } catch {
    // No fresh fix — try the cached one below.
  }

  try {
    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    }
  } catch {
    // Nothing cached either — the photo continues without a location.
  }
  return null;
}

function toNumber(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Applies an N/S/E/W ref to an unsigned value, when one is present. */
function applyRef(value: number, ref: unknown, negative: string): number {
  if (typeof ref !== "string") return value;
  const dir = ref.trim().toUpperCase();
  if (dir === negative) return -Math.abs(value);
  if (dir === "N" || dir === "E") return Math.abs(value);
  return value;
}

function validCoords(latitude: number, longitude: number): boolean {
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

/**
 * Pulls signed decimal coordinates out of an EXIF payload, or null when
 * the photo carries no GPS at all.
 *
 * On Android, expo-image-picker fills GPSLatitude/GPSLongitude with plain
 * doubles when the file has GPS (see ImageExporter.kt — it uses
 * ExifInterface.latLong, which already applies the sign). The refs are
 * honoured here anyway, so a value that arrives unsigned still comes out
 * correct, and numeric strings are tolerated too.
 */
export function readExifCoord(
  exif: Record<string, unknown> | null | undefined
): PhotoCoords | null {
  const rawLat = toNumber(exif?.GPSLatitude);
  const rawLng = toNumber(exif?.GPSLongitude);
  if (rawLat == null || rawLng == null) return null;

  const latitude = applyRef(rawLat, exif?.GPSLatitudeRef, "S");
  const longitude = applyRef(rawLng, exif?.GPSLongitudeRef, "W");

  if (!validCoords(latitude, longitude)) return null;
  return { latitude, longitude };
}

/**
 * Rebuilds coordinates that were passed through router params (which are
 * always strings). Missing, blank or garbled values collapse to null so
 * every caller can treat "no location" as a single state.
 */
export function coordsFromParams(
  latitude?: string | null,
  longitude?: string | null
): PhotoCoords | null {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (lat == null || lng == null) return null;
  if (!validCoords(lat, lng)) return null;
  return { latitude: lat, longitude: lng };
}

/**
 * Serialises coords for router params. Returns an empty object when there
 * is no location, so callers can spread it straight into a params object
 * without emitting "photoLat=" junk.
 */
export function coordsToParams(
  coords: PhotoCoords | null
): { photoLat?: string; photoLng?: string } {
  if (!coords) return {};
  return { photoLat: String(coords.latitude), photoLng: String(coords.longitude) };
}
