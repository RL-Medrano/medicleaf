/**
 * utils/scanHistory.ts
 *
 * In-memory cache of the signed-in member's scan history (the "History"
 * tab and anything else that lists scans).
 *
 * The History screen used to run the same `select` from `scans` on EVERY
 * focus — every tab hop, every back navigation — which padded Supabase's
 * query logs with the exact same rows over and over. Screens now read the
 * cache first and only hit the network when the data is missing, was
 * invalidated by a save/delete, or is older than the TTL below.
 *
 * Memory only (not persisted): after an app restart the first open of
 * History fetches once, then everything after that comes from memory.
 */
import { supabase } from "@/utils/supabase";

export type ScanItem = {
  id: string;
  name: string;
  accuracy: number;
  date: string;
  time: string;
  image_url: string;
};

/**
 * How long a cached list is trusted for. Bumping focus back and forth
 * inside this window costs zero queries; past it we revalidate once in the
 * background (a safety net for changes made outside this app).
 */
const TTL_MS = 5 * 60 * 1000;

type Cache = { userId: string; scans: ScanItem[]; fetchedAt: number };

let cache: Cache | null = null;
/** True once a scan was saved/deleted — the next read must refetch. */
let dirty = false;

/**
 * Call after ANY write to the `scans` table (save a scan, delete a scan)
 * so the next History open shows the change instead of stale rows.
 */
export function invalidateScanHistory(): void {
  dirty = true;
}

/**
 * Fresh cache for this user, or null when the caller must fetch
 * (no cache, different user, invalidated, or past the TTL).
 */
export function getScanHistory(userId: string): ScanItem[] | null {
  if (dirty) return null;
  if (!cache || cache.userId !== userId) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) return null;
  return cache.scans;
}

/**
 * Whatever we hold for this user regardless of age. Shown while a
 * refresh runs so the list never blanks out to a spinner when we already
 * know the content.
 */
export function getStaleScanHistory(userId: string): ScanItem[] | null {
  if (!cache || cache.userId !== userId) return null;
  return cache.scans;
}

/** Store a freshly fetched list (also clears the dirty flag). */
export function setScanHistory(userId: string, scans: ScanItem[]): void {
  cache = { userId, scans, fetchedAt: Date.now() };
  dirty = false;
}

/**
 * Fetches the member's scans, stores them in the cache, and returns them.
 * Kept here so the query text lives in one place and always goes through
 * the cache on the way out.
 *
 * Throws on failure so callers can keep showing whatever they already had.
 */
export async function fetchScanHistory(userId: string): Promise<ScanItem[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("id, name, accuracy, date, time, image_url")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Callers keep showing whatever they already had.
    throw error;
  }

  const scans = data ?? [];
  setScanHistory(userId, scans);
  return scans;
}
