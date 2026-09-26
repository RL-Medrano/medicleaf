import React, { useCallback, useState } from "react";
import { View, Text, Image, Pressable, FlatList, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { GuestPrompt } from "@/components/GuestPrompt";

type ScanItem = {
  id: string;
  name: string;
  accuracy: number;
  date: string;
  time: string;
  image_url: string;
};

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, [])
  );

  async function loadScans() {
    setLoading(true);
    setLoadFailed(false);

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

    const { data, error } = await supabase
      .from("scans")
      .select("id, name, accuracy, date, time, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Don't show "no scans yet" when the real problem is the load failed
      // (for example, no connection).
      console.error("[history] load failed:", error.message);
      setLoadFailed(true);
    } else if (data) {
      setScans(data);
    }
    setLoading(false);
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
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="py-4 items-center" style={{ backgroundColor: "#FFFFFF" }}>
        <Text className="text-xl font-bold" style={{ color: "#1B4332" }}>
          History
        </Text>
      </View>

      {isGuest ? (
        <GuestPrompt message="Create or Log in your account to save and visit your recent scan" />
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            !loading ? (
              <Text className="text-center mt-10" style={{ color: "#40916C" }}>
                {loadFailed
                  ? "Couldn't load your scans. Connect to the internet and try again."
                  : "You haven't saved any scans yet."}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/scanresult", params: { scanId: item.id } })
              }
              className="rounded-2xl p-3 flex-row items-center mb-3"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Image
                source={{ uri: item.image_url }}
                style={{ width: 64, height: 64, borderRadius: 12 }}
              />
              <View className="flex-1 ml-3">
                <Text className="font-bold" style={{ color: "#1B4332" }}>
                  {item.name}
                </Text>
                <Text className="text-xs" style={{ color: "#374151" }}>
                  Accuracy: {item.accuracy}%
                </Text>
                <Text className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  Date: {formatDate(item.date)}
                </Text>
                <Text className="text-xs" style={{ color: "#6b7280" }}>
                  Time: {formatTime(item.time)}
                </Text>
              </View>
              <Image
                source={require("@/assets/images/icons/Chevron_right3.png")}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}