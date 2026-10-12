/**
 * components/GuestPrompt.tsx
 *
 * Shown in place of gated content when the current user is a guest
 * (anonymous session). Used on: Profile, History, Map, and both
 * Community tabs (News Feed / Messages).
 */
import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

type Props = {
  message: string;
  /**
   * Drop the built-in outer spacing (mt-24 / mx-5). Use on screens that
   * already give the prompt its own margins — e.g. Home, whose ScrollView
   * has px-5 and wraps each section in mt-6 — so the card sits at the same
   * width and rhythm as the other cards instead of being pushed down and
   * double-inset. Other screens keep the default (centered, airy).
   */
  flush?: boolean;
};

export function GuestPrompt({ message, flush = false }: Props) {
  return (
    <View
      className={`rounded-2xl p-6 items-center${flush ? "" : " mx-5 mt-24"}`}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <Text className="text-center" style={{ color: "#40916C" }}>
        {message}
      </Text>
      <Pressable
        onPress={() => router.push("/welcome")}
        className="rounded-full py-3 px-8 items-center mt-4"
        style={{ backgroundColor: "#40916C" }}
      >
        <Text className="text-white font-bold">Go to Accounts</Text>
      </Pressable>
    </View>
  );
}