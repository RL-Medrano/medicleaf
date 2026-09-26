import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

// Guest mode is local-only: tapping "Continue as Guest" saves this flag on
// the phone and nothing on the server (no anonymous account, no profile
// row). It's cleared as soon as the user signs in for real.
const LOCAL_GUEST_KEY = "isLocalGuest";

export async function setLocalGuest(): Promise<void> {
  await AsyncStorage.setItem(LOCAL_GUEST_KEY, "true");
}

export async function clearLocalGuest(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCAL_GUEST_KEY);
  } catch (err) {
    console.error("[guest] failed to clear local guest flag:", err);
  }
}

export async function isLocalGuest(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LOCAL_GUEST_KEY)) === "true";
  } catch {
    return false;
  }
}

/**
 * The one place screens should ask "guest or member?".
 * - Signed-in member:      { user, isGuest: false }
 * - Old anonymous session: { user, isGuest: true }  (kept so existing test guests still work)
 * - Local guest:           { user: null, isGuest: true }
 * - Nobody:                { user: null, isGuest: false }
 *
 * Uses getSession(), which reads the stored session, so it works offline.
 */
export async function getAuthState() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    return { user, isGuest: !!user.is_anonymous };
  }
  return { user: null, isGuest: await isLocalGuest() };
}