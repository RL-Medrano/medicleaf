import React, { useState } from "react";
import { View, Text, Pressable, StatusBar, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { PinInput } from "@/components/PinInput";
import { isValidPin, setPin, markPinVerified, isWeakPin } from "@/utils/pin";

export default function CreatePinScreen() {
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

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
        Alert.alert("You're offline", "Connect to the internet to save your PIN.");
        return;
      }

      // The row is hashed server-side — nothing PIN-shaped is stored here.
      await setPin(pin);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await markPinVerified(session.user.id);

      // The account is finished. Drop every auth screen (welcome, sign-up,
      // PIN steps) from the history first — replace alone only swaps the
      // top screen, which is what used to leave the finished sign-up form
      // buried under Home for the back gesture to find.
      router.dismissAll();
      router.replace("/tab/home");
    } catch (err) {
      console.error("[createpin] save failed:", err);
      Alert.alert("Something went wrong", "Couldn't save your PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: "#1B4332", fontSize: 16 }}>{"< Back"}</Text>
        </Pressable>

        <View className="items-center mt-10">
          <Text className="text-2xl font-bold" style={{ color: "#1B4332" }}>
            Create your PIN
          </Text>
          <Text className="text-sm text-center mt-2 px-4" style={{ color: "#40916C" }}>
            You'll enter this 6-digit PIN every time you sign in, after your
            password.
          </Text>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}
