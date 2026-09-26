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
};

export function GuestPrompt({ message }: Props) {
  return (
    <View
      className="rounded-2xl p-6 mx-5 mt-24 items-center"
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