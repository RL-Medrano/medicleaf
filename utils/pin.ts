/**
 * utils/pin.ts
 *
 * The 6-digit sign-in PIN that sits behind the password.
 *
 * The app never sees or stores a PIN hash — it only sends the 6 digits to
 * the Postgres functions in supabase/user_pins.sql, which hash and compare
 * server-side and answer with true/false. That table has RLS enabled with
 * no client policies, so there is no query that would leak a hash.
 *
 * "Has the PIN been verified for this app session?" is tracked locally in
 * AsyncStorage. It is a client-side gate (a modified client could skip it),
 * but it is what stops the splash screen from dropping a half-logged-in
 * user straight into Home after they background the app on the PIN screen.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export const PIN_LENGTH = 6;

const PIN_PATTERN = /^[0-9]{6}$/;

/** Exactly 6 digits, nothing else. */
export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

/** Does this account already have a PIN? Drives create vs. verify. */
export async function hasPin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("user_has_pin");
  if (error) throw error;
  return data === true;
}

/** True when the 6 digits match the stored PIN. */
export async function verifyPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_user_pin", { p_pin: pin });
  if (error) throw error;
  return data === true;
}

/** Create the PIN, or replace an existing one (used by Forgot PIN too). */
export async function setPin(pin: string): Promise<void> {
  const { error } = await supabase.rpc("set_user_pin", { p_pin: pin });
  if (error) throw error;
}

/** Catches the PINs people pick by reflex (123456, 000000, …). */
const WEAK_PINS = [
  "000000", "111111", "222222", "333333", "444444",
  "555555", "666666", "777777", "888888", "999999",
  "123456", "654321",
];

export function isWeakPin(pin: string): boolean {
  return WEAK_PINS.includes(pin);
}

/**
 * Where a just-signed-in user should go, based on whether their account has
 * a PIN yet.
 *
 * Every path into the app ends here instead of at /tab/home — password
 * login, Google sign-in, the email-confirmation button, set-username — so
 * that no sign-in route can quietly skip the gate.
 *
 * If the check itself fails (offline, or user_pins.sql never applied) we
 * fail TOWARD the gate rather than past it: showing a screen that reports
 * the real problem is better than letting someone through unchecked.
 */
export type PinGateRoute = "/auth/verifypin" | "/auth/createpin";

export async function nextRouteAfterSignIn(): Promise<PinGateRoute> {
  try {
    return (await hasPin()) ? "/auth/verifypin" : "/auth/createpin";
  } catch (err) {
    console.error("[pin] has PIN check failed:", err);
    return "/auth/verifypin";
  }
}

// ── "Verified this session" flag ──────────────────────────────────────────
// Holds the id of the user whose PIN has been entered, so a different
// account signing in on the same device can't inherit it.

const PIN_VERIFIED_KEY = "medicleaf_pin_verified_user";

export async function markPinVerified(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PIN_VERIFIED_KEY, userId);
  } catch (err) {
    console.error("[pin] failed to save verified flag:", err);
  }
}

export async function isPinVerified(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PIN_VERIFIED_KEY)) === userId;
  } catch (err) {
    console.error("[pin] failed to read verified flag:", err);
    // Failing closed would strand the user on the PIN screen on a storage
    // glitch, so treat an unreadable flag as verified.
    return true;
  }
}

/** Call on logout / account deletion so the next sign-in must re-verify. */
export async function clearPinVerified(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PIN_VERIFIED_KEY);
  } catch (err) {
    console.error("[pin] failed to clear verified flag:", err);
  }
}
