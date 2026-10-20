import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { getAuthState } from "@/utils/guest";
import { markTutorialStep } from "@/utils/tutorial";
import {
  fetchScanHistory,
  getScanHistory,
  getStaleScanHistory,
  hydrateScanHistory,
  type ScanItem,
} from "@/utils/scanHistory";
import { GuestPrompt } from "@/components/GuestPrompt";
import HistoryWalkthrough from "@/components/HistoryWalkthrough";
import RingLoader from "@/components/RingLoader";

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // Pull-to-refresh spinner, kept separate from `loading` so a manual
  // refresh doesn't swap the list out for the big loading animation.
  const [refreshing, setRefreshing] = useState(false);
  // Stops two rapid focuses from stacking two identical queries.
  const inFlight = useRef(false);

  /* First-run walkthrough (the "Your scan history" mockup) */
  // The Guide sends ?walkthrough=<token> on every Go press, and this
  // screen marks the guide's step done on every visit (useFocusEffect
  // below) — trusting the param avoids racing that write.
  const { walkthrough } = useLocalSearchParams<{ walkthrough?: string }>();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  // The white header is what the step spotlights — the card then drops
  // right below it, over the dimmed list area, exactly like the mockup.
  const headerRef = useRef<View>(null);

  useEffect(() => {
    if (walkthrough) setShowWalkthrough(true);
  }, [walkthrough]);

  useFocusEffect(
    useCallback(() => {
      loadScans();
      // Opening History completes the tutorial's "History" step (no-op for
      // guests and accounts the guide isn't enrolled in).
      markTutorialStep("history");
    }, [])
  );

  /**
   * @param force skip the cache (pull-to-refresh). Plain focus uses the
   *              cache when it's fresh, so tab-hopping no longer fires the
   *              same select at Supabase every single time.
   */
  async function loadScans(force = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoadFailed(false);

    try {
      // getAuthState() reads the stored session (works offline, so a signed-in
      // member isn't mistaken for a guest) and also recognises a local guest,
      // who has no session at all.
      const { user, isGuest: guest } = await getAuthState();

      if (!user || guest) {
        setIsGuest(true);
        setScans([]);
        setLoading(false);
        return;
      }

      setIsGuest(false);

      // Disk → memory (no-op once loaded this run). This is what keeps
      // History working after an app restart with no connection.
      await hydrateScanHistory(user.id);

      // Fresh cache (nothing changed, still inside the TTL) → render from
      // memory, zero queries.
      const fresh = force ? null : getScanHistory(user.id);
      if (fresh) {
        setScans(fresh);
        setLoading(false);
        return;
      }

      // Older copy exists → keep it on screen and revalidate silently.
      // The loading animation only appears when we have nothing at all.
      const stale = getStaleScanHistory(user.id);
      if (stale) {
        setScans(stale);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const freshScans = await fetchScanHistory(user.id);
        setScans(freshScans);
      } catch (err) {
        // Don't show "no scans yet" when the real problem is the load failed
        // (for example, no connection). Stale rows stay put if we had any.
        console.error("[history] load failed:", (err as Error).message);
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    } finally {
      inFlight.current = false;
    }
  }

  // Pull-to-refresh: the one guaranteed way to force a fresh fetch now
  // that plain focus is cached.
  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadScans(true);
    } finally {
      // Also covers loadScans bailing out on an already-running load.
      setRefreshing(false);
    }
  }

  function formatDate(dateValue: string) {
    // A plain "YYYY-MM-DD" is read as UTC midnight by new Date(), which can
    // show the previous day west of UTC. Build it from its parts instead.
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
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace("AM", "am")
      .replace("PM", "pm");
  }

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

        <View ref={headerRef} className="py-4 items-center" style={{ backgroundColor: "#FFFFFF" }}>
          <Text className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
            History
          </Text>
        </View>

        <View className="flex-1">
          {isGuest ? (
            <GuestPrompt message="Create or Log in your account to save and visit your recent scan" />
          ) : (
            <>
              {loadFailed && scans.length > 0 && (
                <View
                  className="mx-5 mt-3 rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: "#F3F4F6" }}
                >
                  <Text style={{ color: "#6b7280", fontSize: 12, textAlign: "center" }}>
                    You're offline — showing previously loaded data
                  </Text>
                </View>
              )}
            <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#40916C"
              colors={["#40916C"]}
            />
          }
          ListEmptyComponent={
            loading ? (
              // First load with nothing cached yet — spinning ring +
              // label so the empty gap reads as "still fetching".
              <View className="items-center mt-20">
                <RingLoader size={60} strokeWidth={6} />
                <Text className="mt-4 font-semibold" style={{ color: "#40916C", fontSize: 16 }}>
                  Loading your scans…
                </Text>
              </View>
            ) : (
              <Text className="text-center mt-10" style={{ color: "#40916C" }}>
                {loadFailed
                  ? "Couldn't load your scans. Connect to the internet and try again."
                  : "You haven't saved any scans yet."}
              </Text>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/scanresult", params: { scanId: item.id } })
              }
              className="rounded-2xl p-3 flex-row items-center mb-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Image
                source={{ uri: item.image_url }}
                style={{ width: 112, height: 112, borderRadius: 12 }}
              />
              <View className="flex-1 ml-3 justify-center">
                {/* Accuracy pill removed per updated mockup */}
                <Text
                  className="font-bold"
                  style={{ color: "#1A1A1A", fontSize: 18 }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text className="mt-1.5" style={{ color: "#6b7280", fontSize: 14 }}>
                  Date: {formatDate(item.date)}
                </Text>
                <Text style={{ color: "#6b7280", fontSize: 14 }}>
                  Time: {formatTime(item.time)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 22,
                  color: "#6b7280",
                  marginLeft: 6,
                }}
              >
                ›
              </Text>
            </Pressable>
          )}
            />
            </>
          )}
        </View>
      </SafeAreaView>

      {/* First-run coach-mark walkthrough — sent by the Guide's Go button
          while the "History" row is unfinished. */}
      {showWalkthrough && (
        <HistoryWalkthrough
          targets={{ header: headerRef }}
          onFinish={() => setShowWalkthrough(false)}
        />
      )}
    </View>
  );
}