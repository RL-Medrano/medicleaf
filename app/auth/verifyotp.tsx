import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (code.trim().length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setLoading(false);

    if (error) {
      Alert.alert("Couldn't verify", error.message);
      return;
    }

    // data.session is now set — this is the real login.
    router.replace("/tab/home");
  }

  async function handleResend() {
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setResending(false);

    if (error) {
      Alert.alert("Couldn't resend", error.message);
    } else {
      Alert.alert("Code sent", "A new code has been sent to your email.");
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "#1B4332", fontSize: 16 }}>{"< Back"}</Text>
        </Pressable>

        <View className="items-center mt-10">
          <Text className="text-2xl font-bold" style={{ color: "#1B4332" }}>
            Verify it's you
          </Text>
          <Text className="text-sm text-center mt-2 px-6" style={{ color: "#40916C" }}>
            We sent a 6-digit code to {email}. Enter it below to finish signing in.
          </Text>
        </View>

        <View className="mt-10">
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
            className="rounded-xl px-4 py-3 mb-4 text-center text-2xl tracking-widest"
            style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
          />

          <Pressable
            onPress={handleVerify}
            disabled={loading}
            className="rounded-full py-4 items-center mb-4"
            style={{ backgroundColor: "#40916C" }}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Text>
          </Pressable>

          <Pressable onPress={handleResend} disabled={resending}>
            <Text
              className="font-semibold text-sm text-center underline"
              style={{ color: "#2D6A4F" }}
            >
              {resending ? "Sending..." : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}