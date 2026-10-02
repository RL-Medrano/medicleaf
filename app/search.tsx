import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, TextInput, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { markTutorialStep } from "@/utils/tutorial";
import { getRandomPlants, PLANTS, Plant, PlantTag } from "@/data/plants";
import { CachedPlantImage } from "@/components/CachedPlantImage";

const DEFAULT_TAGS: PlantTag[] = ["Cough", "Fever", "Indigestion", "Wound", "Diabetes"];
const MAX_RECENT_SEARCHES = 8;

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<PlantTag | null>(null);

  // Cross-device recent searches (Supabase — logged-in users only)
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recommendations — 5 random plants, reshuffled on every visit to this
  // screen (see the focus effect below). The ref remembers the previous
  // set so two visits in a row don't hand out the exact same five.
  const [recommended, setRecommended] = useState<Plant[]>(() => getRandomPlants(5));
  const previousRecommendIds = useRef<string[]>(recommended.map((plant) => plant.id));

  const isSearching = query.trim().length > 0 || activeTag !== null;
  const showRecentDropdown =
    isFocused && query.trim().length === 0 && !activeTag && !isGuestUser && recentSearches.length > 0;

  useEffect(() => {
    loadUserAndRecentSearches();
  }, []);

  // Every visit: complete the tutorial's "Library" step (no-op for guests
  // and accounts the guide isn't enrolled in) and hand out a fresh set of
  // 5 recommendation plants.
  useFocusEffect(
    useCallback(() => {
      markTutorialStep("library");

      const next = getRandomPlants(5, previousRecommendIds.current);
      previousRecommendIds.current = next.map((plant) => plant.id);
      setRecommended(next);
    }, [])
  );

  // ---------- Cross-device recent searches (Supabase) ----------

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
    if (!trimmed || !userId) return;

    setRecentSearches((prev) =>
      [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      )
    );

    await supabase.from("recent_searches").upsert(
      { user_id: userId, query: trimmed, created_at: new Date().toISOString() },
      { onConflict: "user_id,query" }
    );
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

  // ---------- Shared search logic ----------

  const filteredPlants = useMemo(() => {
    // Trim once so a trailing space from the keyboard doesn't break matching.
    const q = query.trim().toLowerCase();

    return PLANTS.filter((plant) => {
      const matchesQuery =
        q.length === 0 ||
        plant.name.toLowerCase().includes(q) ||
        plant.scientific_name.toLowerCase().includes(q) ||
        // Typed health words ("skin", "kidney", "cough") match a plant's tags too
        plant.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag = !activeTag || plant.tags.includes(activeTag);

      return matchesQuery && matchesTag;
    });
  }, [query, activeTag]);

  function toggleTag(tag: PlantTag) {
    // Work out the next value here instead of inside the state updater, so
    // the side effects below run once per tap (React runs updater functions
    // twice in development Strict Mode).
    const next = activeTag === tag ? null : tag;
    setActiveTag(next);

    if (next) saveRecentSearch(tag);
  }

  function goToDetail(plantId: string) {
    // plantdetail.tsx reads the plant's slug, which is the same string as
    // the plant's id in data/plants.ts.
    router.push({ pathname: "/plantdetail", params: { slug: plantId } });
  }

  function handleSubmitSearch() {
    const trimmed = query.trim();
    if (trimmed) saveRecentSearch(trimmed);
    setIsFocused(false);
  }

  function selectRecentSearch(term: string) {
    setQuery(term);
    saveRecentSearch(term);
    setIsFocused(false);
  }

  // Tapping a chip in the Recent Searches row: a recent that is exactly a
  // health tag keeps the tag-filter behaviour; everything else runs as a
  // normal text search.
  function pressChip(term: string) {
    if ((DEFAULT_TAGS as string[]).includes(term)) {
      toggleTag(term as PlantTag);
    } else {
      selectRecentSearch(term);
    }
  }

  function handleFocus() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setIsFocused(true);
  }

  function handleBlur() {
    // Small delay so a tap on a recent-search row registers before the
    // dropdown unmounts (blur fires before the row's onPress otherwise).
    blurTimeout.current = setTimeout(() => setIsFocused(false), 150);
  }

  // What the "no results" message should mention: the typed text if there
  // is any, otherwise the selected tag.
  const emptyLabel = query.trim() ? query.trim() : activeTag ?? "";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center px-5 mt-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </Pressable>
        <Text className="text-xl font-bold" style={{ color: "#1B4332" }}>
          Search Medicinal Plant
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Search bar */}
        <View
          className="flex-row items-center rounded-full px-4 py-3 mt-5"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            placeholder="Search medicinal plant, health issues..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-sm"
            style={{ color: "#1B4332" }}
          />
          <Pressable onPress={handleSubmitSearch} hitSlop={8}>
            <Image
              source={require("@/assets/images/icons/search.png")}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </Pressable>
        </View>

        {/* Recent searches dropdown — shown when focused with an empty query */}
        {showRecentDropdown && (
          <View className="mt-5">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                Recent Searches
              </Text>
              <Pressable onPress={clearAllRecentSearches} hitSlop={8}>
                <Text className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                  Clear all
                </Text>
              </Pressable>
            </View>

            {recentSearches.map((term) => (
              <Pressable
                key={term}
                onPress={() => selectRecentSearch(term)}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Image
                    source={require("@/assets/images/icons/Clock.png")}
                    style={{ width: 15, height: 15, marginRight: 10 }}
                    resizeMode="contain"
                  />
                  <Text
                    className="text-sm flex-1"
                    style={{ color: "#1B4332" }}
                    numberOfLines={1}
                  >
                    {term}
                  </Text>
                </View>
                <Pressable onPress={() => removeRecentSearch(term)} hitSlop={10}>
                  <Text style={{ fontSize: 15, color: "#9ca3af" }}>✕</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}

        {!showRecentDropdown && (
          <>
            {!isSearching ? (
              <>
                {/* Default browsing state. The "clear" action stays even
                    when there's nothing to clear — the chips area below is
                    simply empty for a user with no recent searches. */}
                <View className="flex-row justify-between items-center mt-6 mb-2">
                  <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                    Recent Searches
                  </Text>
                  <Pressable onPress={clearAllRecentSearches} hitSlop={8}>
                    <Text className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                      clear
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap">
                  {recentSearches.map((term) => {
                    const active = activeTag === term;
                    return (
                      <Pressable
                        key={term}
                        onPress={() => pressChip(term)}
                        className="rounded-full px-4 py-2 mr-2 mb-2 border"
                        style={{
                          borderColor: "#1B4332",
                          backgroundColor: active ? "#1B4332" : "#FFFFFF",
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: active ? "#FFFFFF" : "#1B4332" }}
                        >
                          {term}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Recommendations — 5 plants, reshuffled on every visit */}
                <Text className="font-bold text-base mt-4 mb-2" style={{ color: "#1B4332" }}>
                  Recommendations
                </Text>

                {recommended.map((plant) => (
                  <Pressable
                    key={plant.id}
                    onPress={() => goToDetail(plant.id)}
                    className="rounded-2xl p-3 mb-3 flex-row items-center"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <CachedPlantImage
                      plantId={plant.id}
                      remoteUrl={plant.imageUrl}
                      style={{ width: 64, height: 64, borderRadius: 12 }}
                    />
                    <View className="flex-1 ml-3">
                      <Text className="font-bold" style={{ color: "#1B4332" }}>
                        {plant.name}
                      </Text>
                      <Text className="text-sm" style={{ color: "#374151" }}>
                        {plant.scientific_name}
                      </Text>
                    </View>
                    <Image
                      source={require("@/assets/images/icons/Chevron_right.png")}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                {/* Active search / filter state */}
                {filteredPlants.map((plant) => (
                  <Pressable
                    key={plant.id}
                    onPress={() => goToDetail(plant.id)}
                    className="rounded-2xl p-4 mt-5 mb-3"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <View className="flex-row items-center">
                      <CachedPlantImage
                        plantId={plant.id}
                        remoteUrl={plant.imageUrl}
                        style={{ width: 64, height: 64, borderRadius: 12 }}
                      />
                      <View className="flex-1 ml-3">
                        <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                          {plant.name}
                        </Text>
                        <Text className="text-sm" style={{ color: "#374151" }}>
                          {plant.scientific_name}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mt-3">
                      <Text
                        className="flex-1 text-xs leading-5 pr-2"
                        style={{ color: "#6b7280" }}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {plant.about}
                      </Text>
                      <Image
                        source={require("@/assets/images/icons/Chevron_right.png")}
                        style={{ width: 18, height: 18 }}
                        resizeMode="contain"
                      />
                    </View>
                  </Pressable>
                ))}

                {filteredPlants.length === 0 && (
                  <Text className="text-sm text-center mt-8" style={{ color: "#6b7280" }}>
                    {emptyLabel ? `No plants found for "${emptyLabel}"` : "No plants found"}
                  </Text>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}