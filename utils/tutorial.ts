/**
 * utils/tutorial.ts
 *
 * State for the first-run Tutorial Guide shown on Home (the green
 * "Tutorial Guide" panel with 5 steps).
 *
 * Only accounts that were JUST created get it: app/auth/signup.tsx calls
 * enableTutorial() right after a successful email sign-up, and
 * app/setusername.tsx calls it after a Google account picks its username —
 * those are exactly the two "brand new account" paths in this app. Existing
 * accounts that simply log in never get the key, so they never see it.
 *
 * Storage is AsyncStorage keyed by user id:
 *   tutorial:<userId> -> { enabled, done: stepId[], collapsed }
 *
 * Once all 5 steps are done, `enabled` flips to false for good — the panel
 * never comes back (not even after a logout/login on the same device).
 * Guests (local or anonymous) never get a key, so they never see it either.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";
import type { Href } from "expo-router";
import { supabase } from "@/utils/supabase";

export type TutorialStepId =
  | "scanpost"
  | "library"
  | "history"
  | "message"
  | "viewposts";

export type TutorialStep = {
  id: TutorialStepId;
  title: string;
  subtitle: string;
  icon: ImageSourcePropType;
  /** Same icon, shown once the step is finished — mint circle baked in. */
  doneIcon: ImageSourcePropType;
  /** Where the "Go" button takes the user (typed route, see expo-router). */
  route: Href;
  /** Community screen only: land on its Messages tab instead of the feed. */
  openMessages?: boolean;
};

// Order matches the mockup exactly.
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "scanpost",
    title: "Scan & Post",
    subtitle: "Scan a Leaf and Post it",
    icon: require("../assets/images/icons/scan_post.png"),
    doneIcon: require("../assets/images/icons/scan_post(2).png"),
    route: "/scan",
  },
  {
    id: "library",
    title: "Library",
    subtitle: "Learn about Medicinal Plant Leaves",
    icon: require("../assets/images/icons/library.png"),
    doneIcon: require("../assets/images/icons/library(2).png"),
    route: "/search",
  },
  {
    id: "history",
    title: "History",
    subtitle: "Manage your scanned leaves",
    icon: require("../assets/images/icons/history_icons.png"),
    doneIcon: require("../assets/images/icons/history_icons(2).png"),
    route: "/tab/history",
  },
  {
    id: "message",
    title: "Message",
    subtitle: "Chat with other users",
    icon: require("../assets/images/icons/message_icon.png"),
    doneIcon: require("../assets/images/icons/message_icon(2).png"),
    route: "/tab/community",
    openMessages: true,
  },
  {
    id: "viewposts",
    title: "View Posts",
    subtitle: "Explore what others are sharing",
    icon: require("../assets/images/icons/view_post.png"),
    doneIcon: require("../assets/images/icons/view_post(2).png"),
    route: "/tab/community",
  },
];

export type TutorialState = {
  enabled: boolean;
  done: TutorialStepId[];
  collapsed: boolean;
};

const storageKey = (userId: string) => `tutorial:${userId}`;

/**
 * Turn the guide on for a freshly created account. Idempotent: if this
 * account is already tracked (e.g. email sign-up AND setusername both
 * ran), the existing progress is kept.
 */
export async function enableTutorial(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const existing = await AsyncStorage.getItem(storageKey(userId));
    if (existing !== null) return;
    await AsyncStorage.setItem(
      storageKey(userId),
      JSON.stringify({ enabled: true, done: [], collapsed: false } satisfies TutorialState)
    );
  } catch (err) {
    console.error("[tutorial] enable failed:", err);
  }
}

/** null when this user has never been enrolled (logged-in veterans, guests). */
export async function getTutorialState(userId: string | null): Promise<TutorialState | null> {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as Partial<TutorialState>;
    return {
      enabled: parsed.enabled === true,
      done: Array.isArray(parsed.done) ? (parsed.done as TutorialStepId[]) : [],
      collapsed: parsed.collapsed === true,
    };
  } catch (err) {
    console.error("[tutorial] read failed:", err);
    return null;
  }
}

/**
 * Record that a step was completed. Resolves the signed-in user itself so
 * every call site stays one line, and silently does nothing for guests or
 * for an account whose guide is already finished.
 *
 * @returns true when this call actually changed something (so callers can
 *          refresh state if they care).
 */
export async function markTutorialStep(step: TutorialStepId): Promise<boolean> {
  try {
    // getSession() reads the session stored on the phone — no network, and
    // it works offline (unlike getUser(), which round-trips to Supabase).
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (!user || user.is_anonymous) return false;

    const state = await getTutorialState(user.id);
    if (!state || !state.enabled || state.done.includes(step)) return false;

    const done = [...state.done, step];
    const next: TutorialState = {
      ...state,
      done,
      // All 5 done → the guide retires permanently.
      enabled: done.length < TUTORIAL_STEPS.length,
    };
    await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(next));
    return true;
  } catch (err) {
    console.error("[tutorial] mark failed:", err);
    return false;
  }
}

/** Remember whether the panel is collapsed (same user scoping as above). */
export async function setTutorialCollapsed(collapsed: boolean): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const state = await getTutorialState(user.id);
    if (!state) return;

    await AsyncStorage.setItem(
      storageKey(user.id),
      JSON.stringify({ ...state, collapsed } satisfies TutorialState)
    );
  } catch (err) {
    console.error("[tutorial] collapse save failed:", err);
  }
}
