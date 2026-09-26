import React, { useEffect, useRef } from "react";
import { Text, Animated, StatusBar, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { isLocalGuest } from "@/utils/guest";

// How long the finished splash stays on screen before navigating.
const HOLD_AFTER_ANIMATION_MS = 600;
// Max time to wait for the server session check before giving up and
// trusting the local session (slow connections shouldn't freeze the splash).
const SESSION_CHECK_TIMEOUT_MS = 4000;

/**
 * Decides where the user should go. Runs while the animation plays, so the
 * result is usually ready by the time the animation finishes.
 */
async function resolveDestination(): Promise<Href> {
  try {
    // Step 1: has the user ever seen the onboarding carousel?
    const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) return "/onboarding";

    // Step 2: have they gotten past the Get Started screen?
    // Checked separately so closing the app between onboarding and
    // get_started resumes at get_started, not the whole carousel again.
    const hasSeenGetStarted = await AsyncStorage.getItem("hasSeenGetStarted");
    if (!hasSeenGetStarted) return "/get_started";

    // Step 3: both intro steps are done — route based on session.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // A local guest has no session, only the flag saved on this device.
      return (await isLocalGuest()) ? "/tab/home" : "/welcome";
    }

    // Step 4: confirm the account still exists on the server (deleted
    // account, revoked session). Only when online — the app works offline,
    // so offline users keep their local session. Network errors, timeouts
    // and anything other than an auth rejection also keep the session.
    try {
      const online = await checkIsOnline();
      if (online) {
        const result = await Promise.race([
          supabase.auth.getUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_CHECK_TIMEOUT_MS)),
        ]);

        if (result && result.error && [401, 403, 404].includes(result.error.status ?? 0)) {
          await supabase.auth.signOut({ scope: "local" });
          return "/welcome";
        }

        // A Google user who quit before choosing a username would otherwise
        // skip the set-username screen forever. Guests have no username, so
        // they're excluded. Lookup errors and timeouts fall through to Home.
        if (!session.user.is_anonymous) {
          const profileResult = await Promise.race([
            supabase.from("profiles").select("username").eq("id", session.user.id).maybeSingle(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_CHECK_TIMEOUT_MS)),
          ]);

          if (profileResult && !profileResult.error && profileResult.data && !profileResult.data.username) {
            return "/setusername";
          }
        }
      }
    } catch (err) {
      console.error("[splash] session check failed, keeping local session:", err);
    }

    return "/tab/home";
  } catch (err) {
    // Safer fallback than /onboarding — if this is a returning user
    // hitting a transient storage read error, /welcome doesn't force
    // them back through the whole intro sequence unnecessarily.
    console.error("[splash] failed to resolve destination:", err);
    return "/welcome";
  }
}

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Start the storage/session work right away, in parallel with the
    // animation, instead of waiting for a fixed delay afterwards.
    const destination = resolveDestination();

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (!finished) return;

      // Short hold so the finished splash is visible, then navigate.
      timer = setTimeout(async () => {
        const path = await destination;
        if (!cancelled) router.replace(path);
      }, HOLD_AFTER_ANIMATION_MS);
    });

    // If the screen unmounts early (deep link, fast refresh, Strict Mode),
    // stop the animation and make sure we don't navigate afterwards.
    return () => {
      cancelled = true;
      animation.stop();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          source={require("@/assets/images/logo/1.png")}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View
        className="items-center mt-6"
        style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }] }}
      >
        <Text className="text-4xl font-bold tracking-tight" style={{ color: "#1B4332" }}>
          MedicLeaf
        </Text>
        <Text className="text-sm font-semibold mt-1 tracking-widest" style={{ color: "#52B788" }}>
          Discover. Learn. Share.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}