/**
 * utils/network.ts
 *
 * Small helper to check connectivity before attempting an action that
 * requires the network (Save, Post, etc.) — lets us show a specific
 * "you're offline" message instead of a generic error after the fact.
 *
 * Requires: npx expo install @react-native-community/netinfo
 */
import NetInfo from "@react-native-community/netinfo";

/**
 * Returns true if the device currently has a usable internet connection.
 * Checks both "is connected" and "is internet reachable" — a device can
 * be connected to WiFi with no actual internet (e.g. a router with no
 * WAN), so both checks matter.
 */
export async function checkIsOnline(): Promise<boolean> {
  // Bounded: NetInfo.fetch() resolves from native state, but the
  // isInternetReachable probe behind it does real network I/O. With no
  // connection that can stall well past the point where this answer is
  // useful, so a timeout is treated as "not online" — the safe direction,
  // since callers only use this to skip network work.
  try {
    const state = await Promise.race([
      NetInfo.fetch(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    if (!state) return false;
    return !!state.isConnected && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}