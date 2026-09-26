import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "@/components/errorboundary";
import { NetworkProvider } from "@/contexts/Networkcontext";
import { OfflineBanner } from "@/components/Offlinebanner";
import { supabase } from "@/utils/supabase";
import { clearLocalGuest } from "@/utils/guest";

export default function RootLayout() {
  // A local guest has no session, only a flag on the device. As soon as
  // anyone signs in for real (login, sign up, Google), the flag must go —
  // otherwise, after logging out later, the splash screen would send them
  // to Home as a guest instead of Welcome.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        clearLocalGuest();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
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
            <Stack.Screen name="message" />
            <Stack.Screen name="tab" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="search" />
            <Stack.Screen name="plantdetail" />
          </Stack>
        </SafeAreaProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}