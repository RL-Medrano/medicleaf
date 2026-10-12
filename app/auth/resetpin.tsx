import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { PinInput } from "@/components/PinInput";
import { isValidPin, setPin, markPinVerified, isWeakPin } from "@/utils/pin";
import RingLoader from "@/components/RingLoader";

/**
 * Landing spot for the link sent by forgotpin.tsx. The `code` in the URL is
 * exchanged for a session first — without it there's no auth.uid() for
 * set_user_pin() to attach the new PIN to.
 */
export default function ResetPinScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    verifyAccess();
  }, []);

  async function verifyAccess() {
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      setVerifying(false);

      if (error) {
        Alert.alert(
          "Link expired",
          "This reset link is invalid or has expired. Please request a new one."
        );
        router.replace("/auth/forgotpin");
        return;
      }

      setReady(true);
      return;
    }

    // Opened without a code — only reachable if the link was mangled.
    // An existing session still lets the user through.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setVerifying(false);

    if (!session) {
      Alert.alert("Session expired", "Please request a new PIN reset link.");
      router.replace("/auth/forgotpin");
      return;
    }

    setReady(true);
  }

  async function handleSave() {
    if (!isValidPin(pin)) {
      Alert.alert("Invalid PIN", "Your PIN must be exactly 6 digits.");
      return;
    }
    if (isWeakPin(pin)) {
      Alert.alert("Pick a stronger PIN", "That PIN is too easy to guess. Please choose another.");
      return;
    }
    if (pin !== confirm) {
      Alert.alert("PINs don't match", "Please make sure both PINs match.");
      return;
    }

    setLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to save your new PIN.");
        return;
      }

      await setPin(pin);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await markPinVerified(session.user.id);

      router.replace("/tab/home");
    } catch (err) {
      console.error("[resetpin] save failed:", err);
      Alert.alert("Something went wrong", "Couldn't save your new PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#D8F3DC" }}
      >
        <RingLoader size={56} strokeWidth={6} />
        <Text className="mt-4 font-semibold" style={{ color: "#1B4332" }}>
          Verifying your link…
        </Text>
      </SafeAreaView>
    );
  }

  if (!ready) return null; // already redirected in verifyAccess()

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <Text className="text-4xl font-bold mt-6" style={{ color: "#1B4332" }}>
          Set a new PIN
        </Text>
        <Text className="text-sm mt-2" style={{ color: "#40916C" }}>
          Choose a new 6-digit PIN for your account
        </Text>

        <View className="mt-10">
          <PinInput value={pin} onChange={setPinValue} label="New PIN" />
          <PinInput value={confirm} onChange={setConfirm} label="Confirm PIN" />

          <Pressable
            onPress={handleSave}
            disabled={loading}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: "#40916C", opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Saving..." : "Save PIN"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
