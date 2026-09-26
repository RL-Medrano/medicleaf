import React, { useRef } from "react";
import { View, Text, Image, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingEndScreen() {
  const finishingRef = useRef(false);

  async function markSeenAndGo(path: "/welcome" | "/auth/login") {
    if (finishingRef.current) return; // ignore double taps
    finishingRef.current = true;

    try {
      await AsyncStorage.setItem("hasSeenGetStarted", "true");
    } catch (err) {
      // Not fatal — the user just sees this screen again next launch.
      console.error("[get_started] failed to save flag:", err);
    }
    router.replace(path);
  }

  const handleGetStarted = () => markSeenAndGo("/welcome");
  const handleSignIn = () => markSeenAndGo("/auth/login");

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <View className="items-center mt-24">
          <Image
            source={require("@/assets/images/logo/1.png")}
            style={{ width: 160, height: 160 }}
            resizeMode="contain"
          />
          <Text className="text-4xl font-bold mt-4" style={{ color: "#1B4332" }}>
            MedicLeaf
          </Text>
          <Text
            className="text-sm text-center mt-2 px-6"
            style={{ color: "#40916C" }}
          >
            Your companion in discovering medicinal plant and natural healing
          </Text>
        </View>

        <View className="flex-1" />

        <View className="mb-10">
          <Pressable
            onPress={handleGetStarted}
            className="rounded-full py-4 items-center mb-4"
            style={{ backgroundColor: "#40916C" }}
          >
            <Text className="text-white font-bold text-base">Get Started</Text>
          </Pressable>

          <Pressable onPress={handleSignIn} className="flex-row justify-center">
            <Text className="font-semibold text-sm" style={{ color: "#1B4332" }}>
              Already have an account?{" "}
              <Text style={{ color: "#2D6A4F" }}>Sign in Here</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}