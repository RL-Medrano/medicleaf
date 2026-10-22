import React, { useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { PLANTS, type Plant } from "@/data/plants";

// One candidate from the Scanning screen: the model's class slug plus
// display name and score. Only `slug` is used here — the card's photo,
// scientific name and trait chips all come from data/plants.ts, so the
// screen renders entirely from bundled data (works offline, for guests).
type Candidate = {
  slug: string;
  displayName: string;
  score: number;
};

/**
 * "Similar Medicinal Plant" — offered from the Failed-to-Detect state when
 * the model recognized nothing confidently but had nearby guesses (within
 * 60% of its best score, top 5 — see SIMILAR_PLANT_RATIO in
 * utils/plantClassifier.ts). Tapping a card opens the existing plant
 * detail / library screen for that plant.
 */
export default function SimilarPlantsScreen() {
  const { similar } = useLocalSearchParams<{ similar?: string }>();

  // Param JSON → validated candidates. Every slug is re-checked against
  // PLANTS below so a stale/renamed class can't crash the cards.
  const candidates = useMemo<Candidate[]>(() => {
    try {
      const parsed = JSON.parse(similar ?? "[]");
      if (!Array.isArray(parsed)) return [];
      return (parsed as Candidate[]).filter((c) => c && typeof c.slug === "string");
    } catch {
      return [];
    }
  }, [similar]);

  const plants = useMemo(
    () =>
      candidates
        .map((c) => ({ candidate: c, plant: PLANTS.find((p) => p.id === c.slug) }))
        .filter((entry): entry is { candidate: Candidate; plant: Plant } => !!entry.plant),
    [candidates]
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      {/* Back arrow + centered title, matching the mockup. */}
      <View className="px-5 mt-2 mb-3">
        <View className="items-center justify-center">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="absolute left-0"
          >
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
          <Text className="text-xl font-bold" style={{ color: "#1B4332" }}>
            Similar Medicinal Plant
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Normally unreachable (the button hides on empty lists) — kept as
            a safe fallback for malformed params or an outdated slug set. */}
        {plants.length === 0 ? (
          <Text
            className="text-center mt-10 text-sm"
            style={{ color: "#374151" }}
          >
            No similar plants found. Try scanning another photo.
          </Text>
        ) : (
          plants.map(({ candidate, plant }) => (
            <Pressable
              key={candidate.slug}
              onPress={() =>
                router.push({ pathname: "/plantdetail", params: { slug: candidate.slug } })
              }
              className="rounded-2xl mb-4 overflow-hidden"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Image
                source={plant.imageUrl}
                style={{ width: "100%", height: 170 }}
                resizeMode="cover"
              />

              <View className="p-4 flex-row items-center">
                <View className="flex-1 mr-2">
                  <Text className="font-bold text-lg" style={{ color: "#1A1A1A" }}>
                    {plant.name}
                  </Text>
                  <Text className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                    ({plant.scientific_name})
                  </Text>

                  {/* Physical-characteristic chips — the count is whatever
                      that plant has (0 hides the row, up to 6 wrap onto
                      extra lines). */}
                  {plant.traits.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {plant.traits.map((trait) => (
                        <View
                          key={trait}
                          className="rounded-full px-3 py-1"
                          style={{
                            borderWidth: 1,
                            borderColor: "#D1D5DB",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          <Text className="text-xs" style={{ color: "#374151" }}>
                            {trait}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <Image
                  source={require("@/assets/images/icons/Chevron_right.png")}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
