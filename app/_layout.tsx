import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "@/components/errorboundary";
import { NetworkProvider } from "@/contexts/Networkcontext";
import { OfflineBanner } from "@/components/Offlinebanner";
import { supabase } from "@/utils/supabase";
import { clearLocalGuest } from "@/utils/guest";
import { flushGuestScan } from "@/utils/guestScan";

export default function RootLayout() {
  // A local guest has no session, only a flag on the device. As soon as
  // anyone signs in for real (login, sign up, Google), the flag must go —
  // otherwise, after logging out later, the splash screen would send them
  // to Home as a guest instead of Welcome.
  //
  // Same moment drives guest scan retention: SIGNED_IN means SOME account
  // now exists on this device (new sign-up or an existing one logging in),
  // so any scan staged while signed out uploads into it here. Both calls
  // are deferred a tick — invoking supabase.auth from inside its own auth
  // event callback can deadlock its internal lock — and fire-and-forget,
  // so a failure never blocks sign-in: the staging survives and the
  // launch retry below picks it up.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        clearLocalGuest();
        setTimeout(() => {
          void flushGuestScan();
        }, 0);
      }
    });

    // Retry at launch too: a staged scan that failed to flush earlier
    // (offline, upload error) gets another chance every time the app
    // starts. No-ops when nothing is staged or nobody is signed in.
    setTimeout(() => {
      void flushGuestScan();
    }, 0);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      {/* react-native-gesture-handler needs one root view wrapping the whole
          app — PinMap's double-tap-to-expand gesture runs through it. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NetworkProvider>
          <SafeAreaProvider>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="get_started" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="setusername" />
              <Stack.Screen name="scan" />
              <Stack.Screen name="scanresult" />
              <Stack.Screen name="createpost" />
              <Stack.Screen name="chat/[userid]" />
              <Stack.Screen name="tab" />
              <Stack.Screen name="search" />
              <Stack.Screen name="allplants" />
              <Stack.Screen name="plantdetail" />
            </Stack>
          </SafeAreaProvider>
        </NetworkProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}