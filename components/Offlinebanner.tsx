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
import { useNetwork } from "@/contexts/Networkcontext";

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();

  // isInternetReachable can be `null` right after app launch, before the
  // first real check completes — treat that as "assume online" rather
  // than flashing the banner on every cold start.
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) return null;

  return (
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
  );
}