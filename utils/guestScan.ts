/**
 * utils/guestScan.ts
 *
 * Guest scan retention — Option 1 + Variant A (agreed design):
 *
 * - The FIRST guest Save is stored on THIS DEVICE: the photo is copied to
 *   durable document storage (the picker's cache uri does not survive)
 *   and the payload is written under a single AsyncStorage key.
 * - Any later guest Save is refused by the caller (scanresult) with a
 *   "create an account" prompt — one staged scan per device, nothing else
 *   is ever kept while signed out.
 * - The moment ANY account signs in on this device — a brand-new sign-up
 *   OR an existing account logging back in — flushGuestScan() uploads the
 *   staged photo and inserts the row under that user's id. The scan lands
 *   in whichever account they chose; there is no separate "merge" step.
 *
 * Flush is idempotent: staging is cleared only AFTER a successful insert,
 * and the insert carries a client-generated id so a retry after a crash
 * between the two steps hits the primary key (23505) and knows the row
 * already landed instead of inserting a duplicate.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { invalidateScanHistory } from "@/utils/scanHistory";

// guest:* — the device-local namespace for signed-out state.
const STAGING_KEY = "guest:scan";
// <documentDirectory>/guest-scans/ — persistent storage, unlike the cache
// directories image pickers write to, which the OS may clean at any time.
const STAGING_DIR = new Directory(Paths.document, "guest-scans");

export type StagedGuestScan = {
  /** Client-generated uuid — the idempotency key for the eventual insert. */
  id: string;
  plant_slug: string;
  name: string;
  accuracy: string | null;
  date: string | null;
  time: string | null;
  /** Absolute path of the durable photo copy. */
  imagePath: string;
  /** Epoch ms — informational; staged scans do not expire (single slot). */
  stagedAt: number;
};

/** Hermes has no crypto.randomUUID — a v4 uuid from Math.random is fine
 *  here (uniqueness only needs to hold across this device's staged scans). */
function newUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * The staged scan, or null when nothing is staged.
 *
 * A payload whose photo copy has vanished (cleared app storage, wiped
 * data) can never be uploaded — it is dropped here so the guest isn't
 * stuck at the one-save limit forever and can stage a fresh scan.
 */
export async function getStagedGuestScan(): Promise<StagedGuestScan | null> {
  try {
    const raw = await AsyncStorage.getItem(STAGING_KEY);
    if (!raw) return null;

    const staged = JSON.parse(raw) as StagedGuestScan;
    if (!staged?.imagePath || !new File(staged.imagePath).exists) {
      await AsyncStorage.removeItem(STAGING_KEY);
      return null;
    }
    return staged;
  } catch (err) {
    console.error("[guestScan] failed to read staged scan:", err);
    return null;
  }
}

/**
 * Stores the scan on this device (photo copy first, payload second).
 * Throws if either step fails — the caller shows the error alert.
 * No network needed: this is the part that works fully offline.
 */
export async function stageGuestScan(scan: {
  plant_slug: string;
  name: string;
  accuracy: string | null;
  date: string | null;
  time: string | null;
  imageUri: string;
}): Promise<StagedGuestScan> {
  if (!STAGING_DIR.exists) STAGING_DIR.create();

  // Keep the source's extension — Cloudinary infers the resource type
  // from it, and picker/camera uris already carry the right one.
  const ext = scan.imageUri.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".jpg";
  const imageFile = new File(STAGING_DIR, `scan-${Date.now()}${ext}`);

  const staged: StagedGuestScan = {
    id: newUuid(),
    plant_slug: scan.plant_slug,
    name: scan.name,
    accuracy: scan.accuracy,
    date: scan.date,
    time: scan.time,
    imagePath: imageFile.uri,
    stagedAt: Date.now(),
  };

  try {
    await new File(scan.imageUri).copy(imageFile);
    await AsyncStorage.setItem(STAGING_KEY, JSON.stringify(staged));
  } catch (err) {
    // Don't leave a half-staged scan behind: payload write failed after
    // the copy → remove the orphan copy so the next attempt starts clean.
    try {
      if (imageFile.exists) imageFile.delete();
    } catch {
      // best-effort cleanup only
    }
    throw err;
  }

  return staged;
}

// Re-entrancy guard: SIGNED_IN and the launch retry can both fire while a
// flush is already in flight (e.g. sign-in immediately after app start).
let flushing = false;

/**
 * Uploads the staged scan into whichever account is signed in on this
 * device. Safe to call any number of times: no staging → no-op; already
 * inserted → 23505 clears it; offline / not signed in / any failure →
 * stays staged and the next SIGNED_IN or app launch tries again.
 *
 * Called fire-and-forget from the root layout — this must never block
 * the auth event that triggers it.
 */
export async function flushGuestScan(): Promise<void> {
  if (flushing) return;
  flushing = true;

  try {
    const staged = await getStagedGuestScan();
    if (!staged) return;

    // Still a guest → nothing to flush into; keep waiting for sign-in.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const online = await checkIsOnline();
    if (!online) return;

    const upload = await uploadToCloudinary(staged.imagePath, "scans");

    // Same shape a signed-in Save would have written, so the flushed row
    // is indistinguishable from a normal save in History — plus the id
    // (see idempotency note in the file header). Number(null) === 0 here,
    // exactly mirroring performSave()'s accuracy handling.
    const row = {
      user_id: session.user.id,
      plant_slug: staged.plant_slug,
      name: staged.name,
      accuracy: Number(staged.accuracy),
      date: staged.date,
      time: staged.time,
      image_url: upload.url,
      image_public_id: upload.publicId,
    };

    const { error } = await supabase.from("scans").insert({ id: staged.id, ...row });

    if (error && error.code !== "23505") {
      if (error.code === "22P02") {
        // 22P02 = the id column isn't uuid-typed (server-defined key) —
        // retry the plain insert a normal save performs, without an id.
        const { error: retryError } = await supabase.from("scans").insert(row);
        if (retryError) throw retryError;
      } else {
        // Network / RLS / anything else: keep it staged. Retrying with a
        // DIFFERENT insert here could duplicate a row whose first attempt
        // actually committed but whose response was lost.
        throw error;
      }
    }

    // Success — clear the staging, then the photo copy. Order matters:
    // clearing first could lose the scan if the app dies in between,
    // while this order can only cost a duplicate-free re-check later.
    await AsyncStorage.removeItem(STAGING_KEY);
    try {
      const image = new File(staged.imagePath);
      if (image.exists) image.delete();
    } catch {
      // leftover copy at worst — payload is gone, so it never re-uploads
    }

    // History caches between focuses — make the next open refetch.
    invalidateScanHistory();
  } catch (err) {
    console.error("[guestScan] flush failed — will retry on next sign-in:", err);
  } finally {
    flushing = false;
  }
}
