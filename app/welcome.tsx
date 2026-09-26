import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { signInWithGoogle } from "@/utils/googleAuth";
import { checkIsOnline } from "@/utils/network";
import { setLocalGuest } from "@/utils/guest";

export default function WelcomeScreen() {
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Either flow in progress blocks both buttons, so the user can't start a
  // second sign-in while the first is still routing.
  const busy = guestLoading || googleLoading;

  async function routeAfterAuth(userId: string) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Don't guess — an existing user would be sent to pick a username
      // again if we treated a failed lookup as "no profile".
      await supabase.auth.signOut({ scope: "local" });
      Alert.alert("Something went wrong", "Couldn't load your profile. Please try again.");
      return;
    }

    // The DB trigger now creates a profiles row for every new auth.users
    // row automatically — so `profile` itself always exists after Google
    // sign-in. What determines whether they still need to pick a
    // username is whether that field was ever actually filled in.
    if (!profile?.username) {
      router.replace("/setusername");
    } else {
      router.replace("/tab/home");
    }
  }

  async function handleGuestPress() {
    if (busy) return;
    setGuestLoading(true);
    try {
      // Local-only guest: nothing is created on the server, so this works
      // online or offline. The flag just tells the splash screen to let
      // this device into Home without a session.
      await setLocalGuest();
      router.replace("/tab/home");
    } catch (err) {
      console.error("[welcome] failed to start guest mode:", err);
      Alert.alert("Something went wrong", "Couldn't continue as a guest. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleGooglePress() {
    if (busy) return;
    setGoogleLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to sign in with Google.");
        return;
      }

      const session = await signInWithGoogle();
      if (!session) return; // user cancelled

      await routeAfterAuth(session.user.id);
    } catch (err: any) {
      Alert.alert("Google sign-in failed", err.message || "Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <View className="items-center mt-16">
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

        <View className="mb-6">
          <Pressable
            onPress={handleGooglePress}
            disabled={busy}
            className="rounded-full py-4 flex-row items-center justify-center shadow-sm mb-3"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            {googleLoading ? (
              <ActivityIndicator color="#2D6A4F" />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/icons/google.png")}
                  style={{ width: 20, height: 20, marginRight: 8 }}
                  resizeMode="contain"
                />
                <Text className="font-bold text-base" style={{ color: "#2D6A4F" }}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/auth/signup")}
            className="rounded-full py-4 items-center mb-3"
            style={{ backgroundColor: "#40916C" }}
          >
            <Text className="text-white font-bold text-base">Sign Up</Text>
          </Pressable>

          <Pressable
            onPress={handleGuestPress}
            disabled={busy}
            className="rounded-full py-4 items-center mb-4"
            style={{ backgroundColor: "#40916C" }}
          >
            {guestLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Continue as Guest
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/auth/login")}
            className="flex-row justify-center"
          >
            <Text className="font-semibold text-sm" style={{ color: "#40916C" }}>
              Already have an account?{" "}
              <Text style={{ color: "#2D6A4F" }}>Sign in Here</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}