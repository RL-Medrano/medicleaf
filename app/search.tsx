import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, TextInput, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { markTutorialStep } from "@/utils/tutorial";
import useRecentSearches from "@/utils/useRecentSearches";
import { getRandomPlants, PLANTS, Plant, PlantTag } from "@/data/plants";
import { CachedPlantImage } from "@/components/CachedPlantImage";
import SearchWalkthrough from "@/components/SearchWalkthrough";

const DEFAULT_TAGS: PlantTag[] = ["Cough", "Fever", "Indigestion", "Wound", "Diabetes"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<PlantTag | null>(null);

  // Cross-device recent searches (Supabase — logged-in users only),
  // shared with the All Plants screen via utils/useRecentSearches.
  const {
    recentSearches,
    isGuestUser,
    saveRecentSearch,
    removeRecentSearch,
    clearAllRecentSearches,
  } = useRecentSearches();
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recommendations — 5 random plants, reshuffled on every visit to this
  // screen (see the focus effect below). The ref remembers the previous
  // set so two visits in a row don't hand out the exact same five.
  const [recommended, setRecommended] = useState<Plant[]>(() => getRandomPlants(5));
  const previousRecommendIds = useRef<string[]>(recommended.map((plant) => plant.id));

  /* First-run walkthrough (the "Search Medicinal Plant" mockups) */
  // Home's Tutorial Guide pushes /search?walkthrough=<token> on every Go
  // press — a fresh timestamp, so this effect re-fires per press. This
  // screen also marks the step done on visit anyway (useFocusEffect
  // below) — trusting the param avoids racing that write.
  const { walkthrough } = useLocalSearchParams<{ walkthrough?: string }>();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // Live scroll bookkeeping for the walkthrough's auto-scroll.
  const scrollYRef = useRef(0);
  const contentHRef = useRef(0);
  const viewportHRef = useRef(0);
  // The three elements each walkthrough step highlights.
  const searchBarRef = useRef<View>(null);
  const recentSearchesRef = useRef<View>(null);
  const recommendationsRef = useRef<View>(null);

  useEffect(() => {
    if (walkthrough) setShowWalkthrough(true);
  }, [walkthrough]);

  const isSearching = query.trim().length > 0 || activeTag !== null;
  const showRecentDropdown =
    isFocused && query.trim().length === 0 && !activeTag && !isGuestUser && recentSearches.length > 0;

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
    // Results filter live while typing, so most people never press Enter
    // or the search icon — they tap a result straight away. Record the
    // term here too, otherwise that search is silently never saved.
    // (No-op when the query is empty, i.e. tapping a Recommendation.)
    handleSubmitSearch();

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
    <View className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
        <StatusBar barStyle="dark-content" />

        {/* Truly centered title — the arrow is absolutely positioned so
            the title centers on the full header width. The old flex-1 +
            marginRight trick shifted left whenever a larger system font
            made the text truncate, since numberOfLines clips at the end. */}
        <View className="flex-row items-center justify-center px-5 mt-4">
          <Pressable
            onPress={() => router.back()}
            className="absolute left-5"
            hitSlop={12}
          >
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-xl font-bold text-center"
            style={{ color: "#1B4332", maxWidth: "80%" }}
            numberOfLines={1}
          >
            Search Medicinal Plant
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          onLayout={(e) => {
            viewportHRef.current = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, h) => {
            contentHRef.current = h;
          }}
        >
          {/* Search bar */}
          <View
            ref={searchBarRef}
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
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setActiveTag(null);
                }}
                hitSlop={8}
              >
                <Image
                  source={require("@/assets/images/icons/close.png")}
                  style={{ width: 24, height: 24, opacity: 0.5 }}
                  resizeMode="contain"
                />
              </Pressable>
            ) : (
              <Pressable onPress={handleSubmitSearch} hitSlop={8}>
                <Image
                  source={require("@/assets/images/icons/search.png")}
                  style={{ width: 34, height: 34 }}
                  resizeMode="contain"
                />
              </Pressable>
            )}
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
                  <View ref={recentSearchesRef}>
                    <View className="flex-row justify-between items-center mt-6 mb-2">
                      <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                        Recent Searches
                      </Text>
                      <Pressable onPress={clearAllRecentSearches} hitSlop={8}>
                        <Text className="text-sm font-semibold" style={{ color: "#1B4332" }}>
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
                  </View>

                  {/* Recommendations — 5 plants, reshuffled on every visit.
                      "View all" opens the alphabetical All Plants screen. */}
                  <View ref={recommendationsRef}>
                    <View className="flex-row justify-between items-center mt-4 mb-2">
                      <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                        Recommendations
                      </Text>
                      <Pressable onPress={() => router.push("/allplants")} hitSlop={8}>
                        <Text className="text-sm font-semibold" style={{ color: "#1B4332" }}>
                          View all
                        </Text>
                      </Pressable>
                    </View>

                    {recommended.map((plant) => (
                      <Pressable
                        key={plant.id}
                        onPress={() => goToDetail(plant.id)}
                        className="rounded-2xl p-3 mb-3 flex-row items-center"
                        style={{ backgroundColor: "#FFFFFF" }}
                      >
                        <CachedPlantImage
                          plantId={plant.id}
                          source={plant.imageUrl}
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
                  </View>
                </>
              ) : (
                <>
                  {/* Active search / filter state */}
                  {filteredPlants.map((plant) => (
                    <Pressable
                      key={plant.id}
                      onPress={() => goToDetail(plant.id)}
                      className="rounded-2xl p-4 mt-5 mb-3 flex-row items-center"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <CachedPlantImage
                            plantId={plant.id}
                            source={plant.imageUrl}
                            style={{ width: 96, height: 96, borderRadius: 14 }}
                          />
                          <View className="flex-1 ml-3">
                            <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                              {plant.name}
                            </Text>
                            <Text className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                              {plant.scientific_name}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className="text-xs leading-5 mt-3"
                          style={{ color: "#6b7280" }}
                          numberOfLines={4}
                          ellipsizeMode="tail"
                        >
                          {plant.about}
                        </Text>
                      </View>

                      <Image
                        source={require("@/assets/images/icons/Chevron_right.png")}
                        style={{ width: 18, height: 18, marginLeft: 8, opacity: 0.6 }}
                        resizeMode="contain"
                      />
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

      {/* First-run coach-mark walkthrough — sent by the Guide's Go button
          while the Library step is unfinished (see SearchWalkthrough). */}
      {showWalkthrough && (
        <SearchWalkthrough
          targets={{
            searchBar: searchBarRef,
            recentSearches: recentSearchesRef,
            recommendations: recommendationsRef,
          }}
          scrollYRef={scrollYRef}
          contentHRef={contentHRef}
          viewportHRef={viewportHRef}
          scrollTo={(y) => scrollRef.current?.scrollTo({ y, animated: false })}
          onFinish={() => setShowWalkthrough(false)}
        />
      )}
    </View>
  );
}