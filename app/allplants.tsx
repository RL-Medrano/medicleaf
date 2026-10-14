import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PLANTS, Plant, PlantTag } from "@/data/plants";
import { CachedPlantImage } from "@/components/CachedPlantImage";
import useRecentSearches from "@/utils/useRecentSearches";

const DEFAULT_TAGS: PlantTag[] = ["Cough", "Fever", "Indigestion", "Wound", "Diabetes"];

// Every plant in the library, A→Z (the mockup's order — case-insensitive
// so "akapulko" sorts before "Bitter"). Filtering below keeps this order.
const ALL_PLANTS = [...PLANTS].sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
);

/**
 * app/allplants.tsx — the "View all" screen behind the Search screen's
 * Recommendations header (mockup "All Plants.png"). Lists every plant in
 * data/plants.ts sorted alphabetically, with the same search bar and
 * Recent Searches chips as the Search screen. Recent searches come from
 * utils/useRecentSearches, so terms stay in sync between the two screens.
 */
export default function AllPlantsScreen() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<PlantTag | null>(null);
  const { recentSearches, saveRecentSearch, clearAllRecentSearches } = useRecentSearches();

  // Same live filter as the Search screen: typed text matches a plant's
  // name, scientific name, or tags; an active chip narrows by tag.
  const filteredPlants = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ALL_PLANTS.filter((plant) => {
      const matchesQuery =
        q.length === 0 ||
        plant.name.toLowerCase().includes(q) ||
        plant.scientific_name.toLowerCase().includes(q) ||
        plant.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag = !activeTag || plant.tags.includes(activeTag);

      return matchesQuery && matchesTag;
    });
  }, [query, activeTag]);

  // Group the (filtered, still A→Z-sorted) list under its first letter —
  // the "Medicinal Plant List" section headings in the mockup. The list
  // is already sorted, so consecutive plants sharing a letter merge into
  // one group.
  const groupedPlants = useMemo(() => {
    const groups: { letter: string; plants: Plant[] }[] = [];

    for (const plant of filteredPlants) {
      const letter = plant.name.charAt(0).toUpperCase();
      const current = groups[groups.length - 1];

      if (current && current.letter === letter) {
        current.plants.push(plant);
      } else {
        groups.push({ letter, plants: [plant] });
      }
    }

    return groups;
  }, [filteredPlants]);

  function toggleTag(tag: PlantTag) {
    // Work out the next value here instead of inside the state updater, so
    // the side effect below runs once per tap (React runs updater functions
    // twice in development Strict Mode).
    const next = activeTag === tag ? null : tag;
    setActiveTag(next);

    if (next) saveRecentSearch(next);
  }

  function selectRecentSearch(term: string) {
    setQuery(term);
    setActiveTag(null);
    saveRecentSearch(term);
  }

  // Tapping a chip in the Recent Searches row: a recent that is exactly a
  // health tag keeps the tag-filter behaviour; everything else runs as a
  // normal text search — same rule as the Search screen.
  function pressChip(term: string) {
    if ((DEFAULT_TAGS as string[]).includes(term)) {
      toggleTag(term as PlantTag);
    } else {
      selectRecentSearch(term);
    }
  }

  function handleSubmitSearch() {
    const trimmed = query.trim();
    if (trimmed) saveRecentSearch(trimmed);
  }

  function goToDetail(plantId: string) {
    // Most people tap a card straight away without pressing Enter or the
    // search icon — record the typed term here too (no-op when empty).
    handleSubmitSearch();

    // plantdetail.tsx reads the plant's slug, which is the same string as
    // the plant's id in data/plants.ts.
    router.push({ pathname: "/plantdetail", params: { slug: plantId } });
  }

  // What the "no results" message should mention: the typed text if there
  // is any, otherwise the selected tag.
  const emptyLabel = query.trim() ? query.trim() : activeTag ?? "";

  return (
    <View className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
        <StatusBar barStyle="dark-content" />

        {/* Header — back arrow + centered title (mockup "All Plants.png") */}
        <View className="flex-row items-center px-5 mt-4">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            className="flex-1 text-xl font-bold text-center"
            style={{ color: "#1A1A1A", marginRight: 36 }}
            numberOfLines={1}
          >
            Medicinal Plant
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search bar — same pill as the Search screen */}
          <View
            className="flex-row items-center rounded-full px-4 py-3 mt-5"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
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

          {/* Recent Searches — plain chips + clear, per mockup. The clear
              action stays even with nothing to clear (chips area is simply
              empty); deleting a single term happens from the Search
              screen's focused-input list, which has the per-term ✕. */}
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

          {/* Every plant, A→Z, grouped under letter headings — per mockup */}
          <Text className="font-bold text-base mt-4" style={{ color: "#1B4332" }}>
            Medicinal Plant List
          </Text>
          {groupedPlants.map((group) => (
            <View key={group.letter}>
              <Text className="font-bold mt-3 mb-2" style={{ fontSize: 15, color: "#1B4332" }}>
                {group.letter}
              </Text>
              {group.plants.map((plant) => (
                <Pressable
                  key={plant.id}
                  onPress={() => goToDetail(plant.id)}
                  className="rounded-2xl p-3 mb-3 flex-row items-center"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <CachedPlantImage
                    plantId={plant.id}
                    remoteUrl={plant.imageUrl}
                    style={{ width: 96, height: 84, borderRadius: 14 }}
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
          ))}

          {filteredPlants.length === 0 && (
            <Text className="text-sm text-center mt-8" style={{ color: "#6b7280" }}>
              {emptyLabel ? `No plants found for "${emptyLabel}"` : "No plants found"}
            </Text>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
