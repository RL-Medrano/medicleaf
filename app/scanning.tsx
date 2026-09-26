import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { classifyPlantImage } from "@/utils/plantClassifier";
import RingLoader from "@/components/RingLoader";

// TODO: change these paths to wherever your icon images are
const checkIcon = require("@/assets/images/check icon.png");
const unknownIcon = require("@/assets/images/warning.png");

type Status = "checking" | "identified" | "unknown";

// Same fixed slot for every row so nothing shifts when the icon changes
function IconSlot({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="mr-3"
      style={{
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

export default function ScanningScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [status, setStatus] = useState<Status>("checking");

  // Tracks whether the user is still on this screen. Classification runs
  // async and can't be truly "cancelled" mid-flight, but this stops it
  // from updating state or navigating AFTER the user has already backed
  // out — without this, a classification that finishes just after the
  // user cancels could unexpectedly jump them into Scan Result anyway.
  const isActive = useRef(true);

  useEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!imageUri) {
      router.back();
      return;
    }
    runClassification(imageUri);
  }, [imageUri]);

  async function runClassification(uri: string) {
    try {
      // Fully local — no Supabase involved. classifyPlantImage() now
      // returns the plant's full details straight from plant_info.json,
      // so this screen works entirely offline.
      const result = await classifyPlantImage(uri);

      // The user already backed out while this was running — don't
      // touch state or navigate on a screen they've left.
      if (!isActive.current) return;

      if (!result.identified || !result.details) {
        setStatus("unknown");
        return;
      }

      setStatus("identified");

      const now = new Date();
      const accuracy = Math.round(result.confidence * 100);

      // Small delay so the user actually sees the "Plant Identified" tick
      // before we navigate away — matches the state list shown in the design.
      setTimeout(() => {
        if (!isActive.current) return; // check again — they could cancel during this delay too
        router.replace({
          pathname: "/scanresult",
          params: {
            slug: result.slug,
            imageUri: uri,
            accuracy: String(accuracy),
            date: now.toISOString().slice(0, 10), // YYYY-MM-DD
            time: now.toTimeString().slice(0, 5), // HH:MM
          },
        });
      }, 600);
    } catch (err) {
      console.error("[scanning] classification failed:", err);
      if (isActive.current) setStatus("unknown");
    }
  }

  function handleRetry() {
    router.back();
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="px-5">
        <View className="flex-row items-center mt-4">
          <Pressable onPress={handleRetry} hitSlop={12}>
            <Text className="text-2xl" style={{ color: "#1B4332" }}>
              ←
            </Text>
          </Pressable>
        </View>

        <Text
          className="text-2xl font-bold text-center mt-2"
          style={{ color: "#1B4332" }}
        >
          Scanning Medicinal{"\n"}Plant Leaf....
        </Text>

        {imageUri && (
          <View
            className="rounded-2xl mt-6 overflow-hidden"
            style={{ backgroundColor: "#FFFFFF", height: 320 }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Checking Plant */}
        <View
          className="rounded-2xl p-4 mt-5 flex-row items-center"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <IconSlot>
            {status === "checking" ? (
              <RingLoader size={24} strokeWidth={3} />
            ) : (
              <Image
                source={checkIcon}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            )}
          </IconSlot>
          <Text className="font-semibold" style={{ color: "#1B4332" }}>
            Checking Plant
          </Text>
        </View>

        {/* Plant Identified */}
        <View
          className="rounded-2xl p-4 mt-3 flex-row items-center"
          style={{
            backgroundColor: status === "identified" ? "#FFFFFF" : "#F3F4F6",
            opacity: status === "checking" ? 0.5 : 1,
          }}
        >
          <IconSlot>
            {status === "identified" ? (
              <Image
                source={checkIcon}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            ) : (
              <Text className="text-xl">○</Text>
            )}
          </IconSlot>
          <Text className="font-semibold" style={{ color: "#1B4332" }}>
            Plant Identified
          </Text>
        </View>

        {/* Unknown Plant */}
        <View
          className="rounded-2xl p-4 mt-3 flex-row items-center"
          style={{
            backgroundColor: status === "unknown" ? "#FFFFFF" : "#F3F4F6",
            opacity: status === "checking" ? 0.5 : 1,
          }}
        >
          <IconSlot>
            {status === "unknown" ? (
              <Image
                source={unknownIcon}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            ) : (
              <Text className="text-xl">○</Text>
            )}
          </IconSlot>
          <Text
            className="font-semibold"
            style={{ color: status === "unknown" ? "#991B1B" : "#1B4332" }}
          >
            Unknown Plant
          </Text>
        </View>

        {status === "unknown" && (
          <Pressable
            onPress={handleRetry}
            className="rounded-full py-3 items-center mt-6"
            style={{ backgroundColor: "#1B4332" }}
          >
            <Text className="text-white font-bold">Try Again</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}