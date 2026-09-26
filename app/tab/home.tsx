import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { GuestPrompt } from "@/components/GuestPrompt";
import { getRandomPlants, Plant } from "@/data/plants";
import { CachedPlantImage } from "@/components/CachedPlantImage";

type RecentScan = {
  id: string;
  name: string;
  accuracy: number;
  date: string;
  time: string;
  image_url: string;
};

type RecentPost = {
  id: string;
  name: string;
  caption: string | null;
  image_url: string;
  location_name: string | null;
  profiles: { username: string } | null;
};

export default function HomeScreen() {
  const [isGuest, setIsGuest] = useState(false);
  const [displayName, setDisplayName] = useState("there");
  const [recentScan, setRecentScan] = useState<RecentScan | null>(null);
  const [recentPost, setRecentPost] = useState<RecentPost | null>(null);

  // 3 random plants, re-shuffled every time this screen gains focus (app
  // open, or navigating back here) — see useFocusEffect below. The ref
  // tracks the last shown set so the next shuffle avoids repeating it.
  const [featuredPlants, setFeaturedPlants] = useState<Plant[]>(() => getRandomPlants(3));
  const previousFeaturedIds = useRef<string[]>(featuredPlants.map((plant) => plant.id));

  useFocusEffect(
    useCallback(() => {
      const nextFeatured = getRandomPlants(3, previousFeaturedIds.current);
      previousFeaturedIds.current = nextFeatured.map((plant) => plant.id);
      setFeaturedPlants(nextFeatured);
      loadHomeData();
    }, [])
  );

  async function loadHomeData() {
    // getAuthState() reads the session stored on the phone (works offline)
    // and also recognises a local guest, who has no session at all.
    const { user, isGuest: guest } = await getAuthState();
    setIsGuest(guest);

    // Guests have nothing else to load — plant library is local now.
    if (guest || !user) return;

    // These three queries don't depend on each other, so run them
    // concurrently instead of one after another — cuts total wait time
    // down to roughly the slowest single query instead of the sum of all three.
    const [profileResult, scanResult, postResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("id, name, accuracy, date, time, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("posts")
        .select("id, name, caption, image_url, location_name, profiles(username)")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Failed queries used to look the same as "nothing to show". Log them
    // so a broken query (e.g. a missing foreign key for profiles(username))
    // is visible instead of silently hiding a card.
    if (profileResult.error) console.error("[home] profile load failed:", profileResult.error.message);
    if (scanResult.error) console.error("[home] scan load failed:", scanResult.error.message);
    if (postResult.error) console.error("[home] post load failed:", postResult.error.message);

    if (profileResult.data) {
      setDisplayName(profileResult.data.username ?? "there");
    }

    if (scanResult.data) setRecentScan(scanResult.data);

    if (postResult.data) setRecentPost(postResult.data as unknown as RecentPost);
  }

  function formatDate(dateValue: string) {
    // A plain "YYYY-MM-DD" is read as UTC midnight by new Date(), which can
    // show the previous day west of UTC. Build it from its parts instead so
    // it stays a local date.
    const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    const date = plain
      ? new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]))
      : new Date(dateValue);

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeValue: string) {
    const [hours, minutes] = timeValue.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mt-4">
          <View>
            <Text className="text-sm" style={{ color: "#374151" }}>
              Welcome back,
            </Text>
            <Text className="text-2xl font-bold" style={{ color: "#1B4332" }}>
              {isGuest ? "User" : `${displayName}!`}
            </Text>
          </View>

          <Image
            source={require("@/assets/images/logo/1.png")}
            style={{ width: 44, height: 44 }}
            resizeMode="contain"
          />
        </View>

        <View
          className="rounded-2xl p-5 mt-5 flex-row items-center"
          style={{ backgroundColor: "#1B4332" }}
        >
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Identify Medicinal Plant
            </Text>
            <Text className="text-sm mt-1" style={{ color: "#D8F3DC" }}>
              Scan and learn about the plant you found.
            </Text>
            <Pressable
              onPress={() => router.push("/scan")}
              className="rounded-full py-2 px-5 items-center mt-4 self-start"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Text className="font-bold" style={{ color: "#1B4332" }}>
                Scan Now
              </Text>
            </Pressable>
          </View>

          <Image
            source={require("@/assets/images/logo/scan_logo.png")}
            style={{ width: 90, height: 90, marginLeft: 8 }}
            resizeMode="contain"
          />
        </View>

        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
              Recent Scan
            </Text>
            {!isGuest && (
              <Pressable onPress={() => router.push("/tab/history")}>
                <Text className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                  View all
                </Text>
              </Pressable>
            )}
          </View>

          {isGuest ? (
            <GuestPrompt message="Create or Log in your account to see recent scan" />
          ) : recentScan ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/scanresult",
                  params: { scanId: recentScan.id },
                })
              }
              className="rounded-2xl p-3 flex-row items-center"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Image
                source={{ uri: recentScan.image_url }}
                style={{ width: 64, height: 64, borderRadius: 12 }}
              />
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "#D8F3DC" }}
                  >
                    <Text className="text-xs font-bold" style={{ color: "#1B4332" }}>
                      {recentScan.accuracy}%
                    </Text>
                  </View>
                </View>
                <Text className="font-bold mt-1" style={{ color: "#1B4332" }}>
                  {recentScan.name}
                </Text>
                <Text className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  🕐 {formatDate(recentScan.date)} • {formatTime(recentScan.time)}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: "#9ca3af" }}>›</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
              Search Medicinal Plants
            </Text>
            <Pressable onPress={() => router.push("/search")}>
              <Text className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                See all
              </Text>
            </Pressable>
          </View>

          <View className="flex-row justify-between">
            {featuredPlants.map((plant) => (
              <Pressable
                key={plant.id}
                onPress={() =>
                  router.push({ pathname: "/plantdetail", params: { slug: plant.id } })
                }
                style={{ width: "31%" }}
              >
                <CachedPlantImage
                  plantId={plant.id}
                  remoteUrl={plant.imageUrl}
                  style={{ width: "100%", height: 90, borderRadius: 12 }}
                />
                <Text
                  className="text-xs font-bold text-center mt-1"
                  style={{ color: "#1B4332" }}
                  numberOfLines={1}
                >
                  {plant.name}
                </Text>
                <Text
                  className="text-[10px] text-center"
                  style={{ color: "#6b7280" }}
                  numberOfLines={1}
                >
                  ({plant.scientific_name})
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-6 mb-6">
          {isGuest ? (
            <GuestPrompt message="Create or Log in your account to see others posts" />
          ) : recentPost ? (
            <Pressable
              onPress={() => router.push("/tab/community")}
              className="rounded-2xl p-4 flex-row items-center"
              style={{ backgroundColor: "#B7E4C7" }}
            >
              <Image
                source={{ uri: recentPost.image_url }}
                style={{ width: 56, height: 56, borderRadius: 12 }}
              />
              <View className="ml-3 flex-1">
                <Text className="font-bold" style={{ color: "#1B4332" }}>
                  {recentPost.profiles?.username ?? "Someone"}
                </Text>
                <Text className="text-sm" style={{ color: "#1B4332" }}>
                  {recentPost.caption ?? `Found ${recentPost.name}!`}
                </Text>
                {recentPost.location_name && (
                  <Text className="text-xs" style={{ color: "#374151" }}>
                    📍 {recentPost.location_name}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 18, color: "#1B4332" }}>›</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}