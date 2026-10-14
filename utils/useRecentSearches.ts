import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";

const MAX_RECENT_SEARCHES = 8;

/**
 * utils/useRecentSearches.ts
 *
 * Cross-device recent searches, shared by the Search screen
 * (app/search.tsx) and the All Plants screen (app/allplants.tsx) — a term
 * searched on one screen appears as a chip on the other, because both
 * read the same `recent_searches` Supabase table.
 *
 * Backed by Supabase for signed-in users only; local guests are skipped
 * entirely (no account to sync with). Persistence is delete-then-insert
 * rather than upsert(..., { onConflict: "user_id,query" }): an ON CONFLICT
 * target only works if the table has a matching UNIQUE constraint, and
 * without one PostgREST rejects the whole write (the chip would appear
 * from local state but be gone on the next visit). This shape works with
 * or without the constraint and also collapses existing duplicates.
 */
export default function useRecentSearches() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadUserAndRecentSearches();
  }, []);

  async function loadUserAndRecentSearches() {
    // getAuthState() also recognises a local guest (no session at all).
    const { user, isGuest } = await getAuthState();
    setIsGuestUser(isGuest);

    // Guests aren't logged into an account, so there's nothing to sync
    // across devices for them — skip loading/saving recent searches.
    if (!user || isGuest) return;

    setUserId(user.id);

    const { data } = await supabase
      .from("recent_searches")
      .select("query")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_RECENT_SEARCHES);

    if (data) setRecentSearches(data.map((row) => row.query));
  }

  async function saveRecentSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;

    // Guests are skipped on purpose (nothing to sync), but a signed-in
    // account that hasn't resolved yet is a bug — make it visible instead
    // of silently dropping the term.
    if (!userId) {
      if (!isGuestUser) {
        console.warn("[recent-searches] NOT saved — userId not loaded");
      }
      return;
    }

    // Optimistic local update first so the chip appears immediately.
    setRecentSearches((prev) =>
      [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      )
    );

    const { error: deleteError } = await supabase
      .from("recent_searches")
      .delete()
      .eq("user_id", userId)
      .eq("query", trimmed);

    const { error: insertError } = await supabase.from("recent_searches").insert({
      user_id: userId,
      query: trimmed,
      created_at: new Date().toISOString(),
    });

    // PostgREST never throws — it returns { error }. Report the whole
    // object so an RLS rejection or a missing column is identifiable from
    // the Metro console rather than guessed at.
    const error = insertError ?? deleteError;
    if (error) {
      console.error(
        "[recent-searches] NOT persisted:",
        JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
      );
    }
  }

  async function removeRecentSearch(term: string) {
    setRecentSearches((prev) => prev.filter((q) => q !== term));
    if (!userId) return;
    await supabase.from("recent_searches").delete().eq("user_id", userId).eq("query", term);
  }

  async function clearAllRecentSearches() {
    setRecentSearches([]);
    if (!userId) return;
    await supabase.from("recent_searches").delete().eq("user_id", userId);
  }

  return {
    recentSearches,
    isGuestUser,
    saveRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
  };
}
