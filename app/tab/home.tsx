import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { GuestPrompt } from "@/components/GuestPrompt";
import { getRandomPlants, Plant } from "@/data/plants";
import { CachedPlantImage } from "@/components/CachedPlantImage";
import TutorialGuide from "@/components/TutorialGuide";
import { Skel, SKELETON_COLOR, useSkeletonPulse } from "@/components/Skel";
import {
  getTutorialState,
  setTutorialCollapsed,
  type TutorialState,
} from "@/utils/tutorial";

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

  // First-run Tutorial Guide panel. Null for guests and for accounts that
  // were not just created (they never got enrolled — see utils/tutorial.ts).
  const [tutorial, setTutorial] = useState<TutorialState | null>(null);

  // 3 random plants, re-shuffled every time this screen gains focus (app
  // open, or navigating back here) — see useFocusEffect below. The ref
  // tracks the last shown set so the next shuffle avoids repeating it.
  const [featuredPlants, setFeaturedPlants] = useState<Plant[]>(() => getRandomPlants(3));
  const previousFeaturedIds = useRef<string[]>(featuredPlants.map((plant) => plant.id));

  // True until the first loadHomeData() settles. While it's on, the header
  // name and the two account cards render as green skeleton blocks — which
  // is exactly what a slow (or dead) connection looks like on this screen.
  const [loading, setLoading] = useState(true);

  // Gentle pulse on those blocks so "still loading" reads clearly.
  const skeletonPulse = useSkeletonPulse(loading);

  useFocusEffect(
    useCallback(() => {
      const nextFeatured = getRandomPlants(3, previousFeaturedIds.current);
      previousFeaturedIds.current = nextFeatured.map((plant) => plant.id);
      setFeaturedPlants(nextFeatured);
      loadHomeData();
    }, [])
  );

  async function loadHomeData() {
    try {
      // getAuthState() reads the session stored on the phone (works offline)
      // and also recognises a local guest, who has no session at all.
      const { user, isGuest: guest } = await getAuthState();
      setIsGuest(guest);

      // Tutorial guide state — reloaded on every focus so a step completed
      // elsewhere (scan, library, history, messages, posts) shows up as soon
      // as the user comes back here.
      setTutorial(await getTutorialState(user?.id ?? null));

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
    } finally {
      // The skeleton blocks show until this FIRST load settles — content
      // arrived, there's nothing to show, or the queries failed on a bad
      // connection. Runs on every focus, but only matters the first time.
      setLoading(false);
    }
  }

  // Collapsing/expanding the guide — optimistic in state, best-effort persist.
  function handleTutorialToggle() {
    if (!tutorial) return;
    const collapsed = !tutorial.collapsed;
    setTutorial({ ...tutorial, collapsed });
    setTutorialCollapsed(collapsed);
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
            {loading ? (
              // Skeleton: the name pill from the mockup.
              <Animated.View style={{ opacity: skeletonPulse }}>
                <View
                  style={{
                    width: 170,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: SKELETON_COLOR,
                    marginTop: 4,
                  }}
                />
              </Animated.View>
            ) : (
              <Text className="text-2xl font-bold" style={{ color: "#1B4332" }}>
                {isGuest ? "User" : `${displayName}!`}
              </Text>
            )}
          </View>

          <Image
            source={require("@/assets/images/logo/1.png")}
            style={{ width: 44, height: 44 }}
            resizeMode="contain"
          />
        </View>

        {/* First-run Tutorial Guide — only enrolled (brand-new) accounts see
            it, and it retires itself once all 5 steps are done. */}
        {!isGuest && tutorial?.enabled && (
          <View className="mt-5">
            <TutorialGuide state={tutorial} onToggle={handleTutorialToggle} />
          </View>
        )}

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
          {loading ? (
            <Animated.View style={{ opacity: skeletonPulse }}>
              <View
                className="rounded-2xl p-4 flex-row items-center"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <Skel w={88} h={108} style={{ borderRadius: 16 }} />
                <View className="flex-1 ml-3">
                  {/* "Recent Scan" + "View all" */}
                  <View className="flex-row justify-between items-center">
                    <Skel w={96} h={14} />
                    <Skel w={44} h={14} />
                  </View>
                  {/* accuracy pill + plant name */}
                  <View className="flex-row items-center mt-2.5">
                    <Skel w={44} h={14} />
                    <Skel w={72} h={14} style={{ marginLeft: 8 }} />
                  </View>
                  {/* plant name */}
                  <Skel w="72%" h={16} style={{ marginTop: 8 }} />
                  {/* clock + date */}
                  <View className="flex-row items-center mt-2.5">
                    <Skel w={14} h={14} />
                    <Skel w="55%" h={12} style={{ marginLeft: 6 }} />
                  </View>
                </View>
                {/* chevron */}
                <Skel
                  w={24}
                  h={24}
                  style={{ marginLeft: 6, alignSelf: "flex-end", marginBottom: 2 }}
                />
              </View>
            </Animated.View>
          ) : isGuest ? (
            <GuestPrompt message="Create or Log in your account to see recent scan" />
          ) : recentScan ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/scanresult",
                  params: { scanId: recentScan.id },
                })
              }
              className="rounded-2xl p-4 flex-row items-center"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Image
                source={{ uri: recentScan.image_url }}
                style={{ width: 88, height: 108, borderRadius: 16 }}
              />
              <View className="flex-1 ml-3">
                {/* Heading row lives inside the card, as in the mockup. */}
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                    Recent Scan
                  </Text>
                  <Pressable
                    onPress={() => router.push("/tab/history")}
                    hitSlop={8}
                  >
                    <Text className="text-xs font-semibold" style={{ color: "#1B4332" }}>
                      View all
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row items-center mt-2">
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "#D8F3DC" }}
                  >
                    <Text className="text-xs font-bold" style={{ color: "#1B4332" }}>
                      {recentScan.accuracy}%
                    </Text>
                  </View>
                  <Text className="text-sm ml-2" style={{ color: "#6b7280" }}>
                    {recentScan.name}
                  </Text>
                </View>

                <Text className="font-bold text-base mt-1.5" style={{ color: "#1B4332" }}>
                  {recentScan.name}
                </Text>

                <View className="flex-row items-center mt-1.5">
                  <Image
                    source={require("@/assets/images/icons/Clock.png")}
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                  <Text className="text-xs ml-1.5" style={{ color: "#6b7280" }}>
                    {formatDate(recentScan.date)} • {formatTime(recentScan.time)}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  color: "#9ca3af",
                  marginLeft: 4,
                  alignSelf: "flex-end",
                  marginBottom: 2,
                }}
              >
                ›
              </Text>
            </Pressable>
          ) : (
            // Signed in, but nothing scanned yet (mockups A and B).
            <View
              className="rounded-2xl py-8 items-center"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Text className="font-bold" style={{ color: "#1B4332" }}>
                No Recent Scan
              </Text>
            </View>
          )}
        </View>

        {/* White panel behind the whole section — mockup shows the heading
            and the tiles sitting on a card, not straight on the page. */}
        <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF" }}>
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
                style={{
                  width: "31%",
                  // Tiles sit on the white panel, so they need their own edge
                  // to stay readable as separate cards (as in the mockup).
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  padding: 6,
                }}
              >
                <CachedPlantImage
                  plantId={plant.id}
                  remoteUrl={plant.imageUrl}
                  style={{ width: "100%", height: 90, borderRadius: 10 }}
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
          {loading ? (
            <Animated.View style={{ opacity: skeletonPulse }}>
              <View className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF" }}>
                <View className="flex-row justify-between items-center">
                  <Skel w={110} h={14} />
                  <Skel w={22} h={22} />
                </View>
                <View className="flex-row items-center mt-3">
                  <Skel w={86} h={86} style={{ borderRadius: 16 }} />
                  <View className="ml-3 flex-1">
                    <Skel w="72%" h={16} />
                    <Skel w="88%" h={12} style={{ marginTop: 8 }} />
                    <View className="flex-row items-center mt-2.5">
                      <Skel w={12} h={12} />
                      <Skel w="60%" h={12} style={{ marginLeft: 6 }} />
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : isGuest ? (
            <GuestPrompt message="Create or Log in your account to see others posts" />
          ) : recentPost ? (
            <Pressable
              onPress={() => router.push("/tab/community")}
              className="rounded-2xl p-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              {/* Heading spans the card, as in the mockup. */}
              <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
                Recent Post
              </Text>
              <View className="flex-row items-center mt-2">
                <Image
                  source={{ uri: recentPost.image_url }}
                  style={{ width: 86, height: 86, borderRadius: 16 }}
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="font-bold text-base"
                    style={{ color: "#1A1A1A" }}
                    numberOfLines={1}
                  >
                    {recentPost.profiles?.username ?? "Someone"}
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: "#4b5563" }}
                    numberOfLines={1}
                  >
                    {recentPost.caption ?? `Found ${recentPost.name}!`}
                  </Text>
                  {recentPost.location_name && (
                    <View className="flex-row items-center mt-1.5">
                      <Image
                        source={require("@/assets/images/icons/pin.png")}
                        style={{ width: 13, height: 13 }}
                        resizeMode="contain"
                      />
                      <Text className="text-xs ml-1" style={{ color: "#6b7280" }}>
                        {recentPost.location_name}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 20, color: "#9ca3af", marginLeft: 4 }}>›</Text>
              </View>
            </Pressable>
          ) : (
            // Signed in, but no other user has posted yet (mockup A).
            <View
              className="rounded-2xl py-8 items-center"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Text className="font-bold" style={{ color: "#1B4332" }}>
                No Recent Post
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}