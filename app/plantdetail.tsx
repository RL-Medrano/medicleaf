import React, { useRef, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StatusBar, LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getPlantById } from "@/data/plants";
import { CachedPlantImageGallery } from "@/components/CachedPlantImage";

const TABS = ["Overview", "Benefits", "How to use"] as const;
type Tab = (typeof TABS)[number];

export default function PlantDetailScreen() {
  // NOTE: this used to read `plantId`, but every screen that navigates
  // here (scanresult.tsx, History via Go to Library, etc.) sends the
  // plant's slug — the same string used as the key in plant_info.json
  // and as the `id` field in data/plants.ts's PLANTS array. Reading
  // `plantId` here meant this param was always undefined in practice.
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const scrollRef = useRef<ScrollView>(null);
  // Y-position of each section within the scroll content, captured via onLayout
  const sectionY = useRef<Record<Tab, number>>({
    Overview: 0,
    Benefits: 0,
    "How to use": 0,
  });

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
              source={require("@/assets/images/icons/Chevron_left.png")}
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

  function handleTabPress(tab: Tab) {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: Math.max(sectionY.current[tab] - 12, 0), animated: true });
  }

  function recordSectionY(tab: Tab) {
    return (event: LayoutChangeEvent) => {
      sectionY.current[tab] = event.nativeEvent.layout.y;
    };
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center px-5 mt-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Image
            source={require("@/assets/images/icons/Chevron_left.png")}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </Pressable>
        <Text className="text-xl font-bold" style={{ color: "#1B4332" }}>
          {plant.name}
        </Text>
      </View>

      <ScrollView ref={scrollRef} className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View
          className="rounded-2xl mt-5 flex-row overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <CachedPlantImageGallery
            plantId={plant.id}
            imageUrls={plant.images}
            slideStyle={{ width: 140, height: 140 }}
          />
          <View className="flex-1 justify-center px-4">
            <Text className="text-lg font-bold" style={{ color: "#1B4332" }}>
              {plant.name}
            </Text>
            <Text className="text-sm mt-1 italic" style={{ color: "#374151" }}>
              {plant.scientific_name}
            </Text>
            <Text className="text-xs mt-1" style={{ color: "#6b7280" }}>
              {plant.family}
            </Text>
          </View>
        </View>

        {/* Tabs — tapping scrolls to the matching section below, all content stays visible */}
        <View className="flex-row mt-5 mb-4">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => handleTabPress(tab)}
                className="mr-6 pb-2"
                style={{
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: "#1B4332",
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: active ? "#1B4332" : "#9ca3af" }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Overview section */}
        <View onLayout={recordSectionY("Overview")}>
          <View className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF" }}>
            <Text className="font-bold mb-2" style={{ color: "#1B4332" }}>
              About
            </Text>
            <Text className="text-sm leading-5" style={{ color: "#374151" }}>
              {plant.about}
            </Text>
          </View>

          <View className="rounded-2xl p-4 mt-3" style={{ backgroundColor: "#FFFFFF" }}>
            <Text className="font-bold mb-2" style={{ color: "#1B4332" }}>
              Active Compounds
            </Text>
            <View className="flex-row flex-wrap">
              {plant.activeCompounds.map((compound, i) => (
                <View
                  key={i}
                  className="rounded-full px-3 py-1 mr-2 mb-2"
                  style={{ backgroundColor: "#D8F3DC" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                    {compound}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-2xl p-4 mt-3" style={{ backgroundColor: "#B7E4C7" }}>
            <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
              🌿 Did you know?
            </Text>
            <Text className="text-sm leading-5" style={{ color: "#1B4332" }}>
              {plant.funFact}
            </Text>
          </View>
        </View>

        {/* Benefits section */}
        <View onLayout={recordSectionY("Benefits")} className="mt-3">
          <View className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF" }}>
            <Text className="font-bold mb-2" style={{ color: "#1B4332" }}>
              Benefits
            </Text>
            {plant.benefits.map((benefit, i) => (
              <Text key={i} className="text-sm leading-5 mb-1" style={{ color: "#374151" }}>
                • {benefit}
              </Text>
            ))}
          </View>
        </View>

        {/* How to use section */}
        <View onLayout={recordSectionY("How to use")} className="mt-3">
          {plant.preparations.map((prep, i) => (
            <View
              key={i}
              className="rounded-2xl p-4"
              style={{ backgroundColor: "#FFFFFF", marginTop: i === 0 ? 0 : 12 }}
            >
              <Text className="font-bold mb-2" style={{ color: "#1B4332" }}>
                {prep.title}
              </Text>
              <Text className="text-sm leading-5" style={{ color: "#374151" }}>
                {prep.instructions}
              </Text>
            </View>
          ))}

          <View
            className="rounded-2xl p-4 mt-3 border"
            style={{ backgroundColor: "#FFF7E6", borderColor: "#F0B429" }}
          >
            <Text className="font-bold mb-2" style={{ color: "#92610A" }}>
              ⚠ Precautions
            </Text>
            <Text className="text-sm leading-5" style={{ color: "#7A4F08" }}>
              {plant.precautions}
            </Text>
          </View>

          <View className="rounded-2xl p-4 mt-3" style={{ backgroundColor: "#FFFFFF" }}>
            <Text className="font-bold mb-2" style={{ color: "#1B4332" }}>
              Alternative:
            </Text>
            {plant.alternatives.map((alt, i) => (
              <Text key={i} className="text-sm leading-5" style={{ color: "#374151" }}>
                • {alt}
              </Text>
            ))}
          </View>

          <Text className="text-xs text-center mt-4 px-2" style={{ color: "#6b7280" }}>
            This information is for general knowledge only and is not a substitute
            for professional medical advice. Consult a doctor before using any
            herbal remedy.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}