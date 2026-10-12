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

  // Sign In reached this screen via router.replace(), so there is nothing
  // behind it to go back to — send the user to the login form instead.
  function goToLogin() {
    router.replace("/auth/login");
  }

  async function handleVerify() {
    if (!email) {
      Alert.alert("Something went wrong", "No email address was passed to this screen.");
      return;
    }
    if (code.trim().length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setLoading(false);

    if (error) {
      Alert.alert("Couldn't verify", error.message);
      return;
    }

    // Supabase has now issued the session — this is the real, verified
    // login. Home is the landing spot from here.
    router.replace("/tab/home");
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setResending(false);

    if (error) {
      Alert.alert(
        "Couldn't resend",
        error.message.toLowerCase().includes("rate")
          ? "Too many codes requested. Wait a minute, then try again."
          : error.message
      );
    } else {
      Alert.alert("Code sent", "A new code has been sent to your email.");
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <Pressable onPress={goToLogin} hitSlop={12}>
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
            disabled={loading || !email}
            className="rounded-full py-4 items-center mb-4"
            style={{ backgroundColor: "#40916C", opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Text>
          </Pressable>

          <Pressable onPress={handleResend} disabled={resending || !email}>
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