import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getPlantById, getPlantByAlternativeName } from "@/data/plants";
import { CachedPlantImageGallery } from "@/components/CachedPlantImage";

const TABS = ["About", "Benefits", "How to use"] as const;
type Tab = (typeof TABS)[number];

// Characters of the About text shown before it collapses behind "...More".
const ABOUT_COLLAPSED_CHARS = 320;

export default function PlantDetailScreen() {
  // NOTE: this used to read `plantId`, but every screen that navigates
  // here (scanresult.tsx, History via Go to Library, etc.) sends the
  // plant's slug — the same string used as the key in plant_info.json
  // and as the `id` field in data/plants.ts's PLANTS array. Reading
  // `plantId` here meant this param was always undefined in practice.
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("About");
  const [heroIndex, setHeroIndex] = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // Fresh state per plant: hero gallery back on slide 1, About collapsed,
  // and the About tab selected.
  useEffect(() => {
    setHeroIndex(0);
    setAboutExpanded(false);
    setActiveTab("About");
  }, [slug]);

  // Hero slide size is measured from the real container (onLayout) instead of
  // computed from screen width — even a sub-pixel mismatch would let the
  // neighboring slide peek out at the edge, which the mockup doesn't have.
  const [heroWidth, setHeroWidth] = useState(0);

  // getPlantById expects the same string as plant_info.json's keys —
  // e.g. "lagundi", "Aratiles" — since ids in data/plants.ts were
  // written to match those keys exactly, casing included.
  const plant = getPlantById(slug);

  if (!plant) {
    // Same back icon as the normal header below, so this fallback still
    // looks like it belongs to this screen. router.back() returns to
    // whichever screen pushed here — usually scanresult.tsx via "Go to
    // Library" — rather than a hardcoded destination.
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
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ color: "#1B4332" }}>Plant not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // About text is collapsed behind an inline "...More" until tapped —
  // same pattern as scanresult.tsx. The preview always cuts on a word
  // boundary so a word is never sliced in half.
  const aboutTruncated = plant.about.length > ABOUT_COLLAPSED_CHARS;
  const aboutSlice = plant.about.slice(0, ABOUT_COLLAPSED_CHARS);
  const aboutCutAt = aboutSlice.lastIndexOf(" ");
  const aboutPreview =
    aboutTruncated && !aboutExpanded
      ? aboutSlice.slice(0, aboutCutAt > 160 ? aboutCutAt : aboutSlice.length).trim()
      : plant.about;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center px-8 mt-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <Text
          className="flex-1 text-xl font-bold text-center"
          style={{ color: "#1A1A1A", marginRight: 24 }}
          numberOfLines={1}
        >
          {plant.name}
        </Text>
      </View>

      <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
        {/* Hero image — full-width, matches the mockup; falls back to the
            gray "No image available" box when the Cloudinary photo is missing.
            The wrapper clips (overflow hidden + rounded corners) so no part of
            a neighboring slide can ever stick out past the image box. */}
        <View
          className="mt-5"
          onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
          style={{ overflow: "hidden", borderRadius: 16 }}
        >
          {heroWidth > 0 && (
            <CachedPlantImageGallery
              key={plant.id}
              plantId={plant.id}
              imageUrls={plant.images}
              slideStyle={{
                width: heroWidth,
                height: Math.round(heroWidth * 1.2),
                borderRadius: 16,
              }}
              hideDots
              onIndexChange={setHeroIndex}
            />
          )}
        </View>

        {/* Gallery dots — centered under the hero, per the mockup */}
        {plant.images.length > 1 && (
          <View className="flex-row justify-center mt-3">
            <View
              className="flex-row items-center rounded-full px-2.5 py-1.5"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              {plant.images.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    marginHorizontal: 3,
                    backgroundColor: index === heroIndex ? "#1A1A1A" : "#D1D5DB",
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Name + scientific name, with the MedicLeaf logo on the right */}
        <View className="flex-row items-center mt-4">
          <View className="flex-1 mr-3">
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1A1A1A" }}>
              {plant.name}
            </Text>
            <Text className="mt-0.5" style={{ fontSize: 15, color: "#6b7280" }}>
              {plant.scientific_name}
            </Text>
          </View>
          <Image
            source={require("@/assets/images/logo/1.png")}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
          />
        </View>

        {/* Tabs — white rounded bar with an inset active pill, per mockup;
            tapping swaps the card content below, like the Scan Result screen */}
        <View
          className="flex-row mt-5 mb-4 p-1.5"
          style={{ backgroundColor: "#FFFFFF", borderRadius: 16 }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="flex-1 items-center py-3"
                style={{
                  backgroundColor: active ? "#1B4332" : "transparent",
                  borderRadius: 12,
                }}
              >
                <Text
                  className={active ? "font-bold" : "font-semibold"}
                  style={{ fontSize: 15, color: active ? "#FFFFFF" : "#1B4332" }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* About tab — plant.about (collapsed behind "...More") + fun fact */}
        {activeTab === "About" && (
          <>
            <View className="p-5" style={{ backgroundColor: "#FFFFFF", borderRadius: 20 }}>
              <Text className="font-bold mb-2" style={{ color: "#1A1A1A", fontSize: 17 }}>
                About
              </Text>
              <Text className="leading-6" style={{ color: "#374151", fontSize: 15 }}>
                {aboutPreview}
                {aboutTruncated && !aboutExpanded && (
                  <Text
                    className="font-bold"
                    style={{ color: "#1A1A1A" }}
                    onPress={() => setAboutExpanded(true)}
                  >
                    ...More
                  </Text>
                )}
                {aboutTruncated && aboutExpanded && (
                  <Text
                    className="font-bold"
                    style={{ color: "#1A1A1A" }}
                    onPress={() => setAboutExpanded(false)}
                  >
                    {"  Less"}
                  </Text>
                )}
              </Text>
            </View>

            <View
              className="p-5 mt-3"
              style={{ backgroundColor: "#B7E4C7", borderRadius: 20 }}
            >
              <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
                🌿 Did you know?
              </Text>
              <Text className="text-sm leading-5" style={{ color: "#1B4332" }}>
                {plant.funFact}
              </Text>
            </View>
          </>
        )}

        {/* Benefits tab — plant.benefits */}
        {activeTab === "Benefits" && (
          <View className="p-5" style={{ backgroundColor: "#FFFFFF", borderRadius: 20 }}>
            <Text className="font-bold mb-2" style={{ color: "#1B4332", fontSize: 17 }}>
              Benefits
            </Text>
            {plant.benefits.map((benefit, i) => (
              <Text key={i} className="text-sm leading-5 mb-1" style={{ color: "#374151" }}>
                • {benefit}
              </Text>
            ))}
          </View>
        )}

        {/* How to use tab — plant.preparations + precautions + alternatives */}
        {activeTab === "How to use" && (
          <>
            {plant.preparations.map((prep, i) => (
              <View
                key={i}
                className="p-5"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  marginTop: i === 0 ? 0 : 12,
                }}
              >
                <Text className="font-bold mb-2" style={{ color: "#1B4332", fontSize: 17 }}>
                  {prep.title}
                </Text>
                <Text className="text-sm leading-5" style={{ color: "#374151" }}>
                  {prep.instructions}
                </Text>
              </View>
            ))}

            <View
              className="p-5 mt-3 border"
              style={{
                backgroundColor: "#FFF7E6",
                borderColor: "#F0B429",
                borderRadius: 20,
              }}
            >
              <Text className="font-bold mb-2" style={{ color: "#92610A", fontSize: 17 }}>
                ⚠ Precautions
              </Text>
              <Text className="text-sm leading-5" style={{ color: "#7A4F08" }}>
                {plant.precautions}
              </Text>
            </View>

            <View className="p-5 mt-3" style={{ backgroundColor: "#FFFFFF", borderRadius: 20 }}>
              <Text className="font-bold mb-2" style={{ color: "#1B4332", fontSize: 17 }}>
                Alternative:
              </Text>
              {plant.alternatives.map((alt, i) => {
                const target = getPlantByAlternativeName(alt);
                // Link only when the label resolves to a real plant other than
                // this screen — anything else stays plain text (no dead links).
                const linked = target && target.id !== plant.id ? target : null;
                return (
                  <Text
                    key={i}
                    className="text-sm leading-5"
                    style={{ color: "#374151" }}
                    onPress={
                      linked
                        ? () =>
                            router.push({
                              pathname: "/plantdetail",
                              params: { slug: linked.id },
                            })
                        : undefined
                    }
                    accessibilityRole={linked ? "link" : undefined}
                    accessibilityLabel={linked ? `Go to plant ${linked.name}` : undefined}
                  >
                    •{" "}
                    <Text
                      style={
                        linked
                          ? {
                              color: "#2D6A4F",
                              fontWeight: "700",
                              textDecorationLine: "underline",
                            }
                          : undefined
                      }
                    >
                      {alt}
                    </Text>
                  </Text>
                );
              })}
            </View>

            <Text className="text-xs text-center mt-4 px-2" style={{ color: "#6b7280" }}>
              This information is for general knowledge only and is not a substitute
              for professional medical advice. Consult a doctor before using any
              herbal remedy.
            </Text>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
