/**
 * components/OfflineBanner.tsx
 *
 * Renders nothing while online. The instant connectivity drops, shows a
 * thin banner at the top of the screen; disappears automatically the
 * moment the connection returns. Mount this once, above your navigator,
 * inside <NetworkProvider> — it then applies across every screen.
 */
import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "@/contexts/Networkcontext";

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();
  // The banner sits above the navigator, outside every SafeAreaView, so it
  // has to reserve the status-bar space itself — otherwise the clock and
  // battery icons are drawn straight over the "No internet connection" text.
  const insets = useSafeAreaInsets();

  // isInternetReachable can be `null` right after app launch, before the
  // first real check completes — treat that as "assume online" rather
  // than flashing the banner on every cold start.
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) return null;

  return (
    // Top inset keeps the red stripe clear of the clock/battery row — the
    // strip above it stays the normal screen colour, so only the message
    // itself is red (as in the mockup) instead of a full red status bar.
    <View style={{ paddingTop: insets.top, backgroundColor: "#D8F3DC" }}>
      <View
        style={{
          backgroundColor: "#991B1B",
          paddingVertical: 6,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>
          No internet connection
        </Text>
      </View>
    </View>
  );
}