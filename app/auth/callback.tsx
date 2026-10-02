import React, { useEffect } from "react";
import { ActivityIndicator, StatusBar, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

/**
 * Landing page for the Google OAuth redirect (`medicleaf://auth/callback`).
 *
 * The code exchange itself is started by welcome.tsx and keeps running after
 * this screen mounts — when it finishes, routeAfterAuth() replaces this screen
 * with /setusername or /tab/home. So there is nothing to do here but wait.
 *
 * Without this file Expo Router has no route for the redirect and shows
 * "Unmatched Route" for a moment after signing in.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    // Safety net: if the exchange never completes (browser cancelled, request
    // failed), don't strand the user on this screen forever.
    const timer = setTimeout(() => router.replace("/welcome"), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: "#D8F3DC" }}
    >
      <StatusBar barStyle="dark-content" />
      <ActivityIndicator size="large" color="#40916C" />
      <Text className="mt-4 text-base" style={{ color: "#40916C" }}>
        Completing sign-in…
      </Text>
    </SafeAreaView>
  );
}
