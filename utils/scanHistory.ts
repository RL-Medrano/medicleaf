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
 * Memory first, disk second: every fresh fetch is also mirrored to
 * AsyncStorage, and the last saved copy is restored on startup — so
 * History still opens (with an "offline — showing saved data" note) after
 * an app restart with no connection, like Facebook's offline feed.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
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

/** Disk mirror (AsyncStorage) so the list survives an app restart offline. */
const STORAGE_PREFIX = "offline_cache:scan_history:";

/**
 * Call after ANY write to the `scans` table (save a scan, delete a scan)
 * so the next History open shows the change instead of stale rows.
 */
export function invalidateScanHistory(): void {
  dirty = true;
}

/**
 * Restores the persisted copy into memory (no-op once memory already has
 * this user's data). Call once at the start of a load, BEFORE the cache
 * getters — they are synchronous and can't await AsyncStorage themselves.
 */
export async function hydrateScanHistory(userId: string): Promise<void> {
  if (cache && cache.userId === userId) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { scans: ScanItem[]; fetchedAt?: number };
    if (!parsed || !Array.isArray(parsed.scans)) return;
    // Restored rows keep their ORIGINAL fetchedAt, so a restart with a
    // still-fresh copy stays fresh instead of pretending to be brand new.
    cache = { userId, scans: parsed.scans, fetchedAt: parsed.fetchedAt ?? 0 };
  } catch {
    // Corrupt or unreadable — a normal fetch will replace it.
  }
}

/** Removes the persisted copy (sign-out / account deletion). */
export function clearPersistedScanHistory(userId: string): Promise<void> {
  return AsyncStorage.removeItem(STORAGE_PREFIX + userId).catch(() => {});
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
  // Best-effort disk mirror — if the app restarts with no connection, the
  // History tab can still show this list instead of an error.
  AsyncStorage.setItem(
    STORAGE_PREFIX + userId,
    JSON.stringify({ scans, fetchedAt: cache.fetchedAt })
  ).catch(() => {});
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
