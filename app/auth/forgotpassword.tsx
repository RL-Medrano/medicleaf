import React, { useState } from "react";
import { View, Text, Image, TextInput, Pressable, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (!email.trim()) {
      Alert.alert("Missing info", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to request a reset link.");
        return;
      }

      // Must match the ACTUAL file path — app/auth/changepassword.tsx —
      // not just any string. A mismatched path here means the emailed
      // link opens to a route that doesn't exist.
      const redirectTo = Linking.createURL("auth/changepassword");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        Alert.alert("Something went wrong", error.message);
        return;
      }

      Alert.alert(
        "Check your email",
        "If an account exists for this email, a reset link has been sent.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err) {
      console.error("[forgotpassword] request failed:", err);
      Alert.alert("Something went wrong", "Couldn't send the reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <Pressable onPress={() => router.back()}>
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>

        <Text className="text-4xl font-bold mt-4" style={{ color: "#1B4332" }}>
          Forgot Password
        </Text>
        <Text className="text-sm mt-2" style={{ color: "#40916C" }}>
          Please provide the registered email address in your account
        </Text>

        <View className="mt-8">
          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            Email address
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
          />
        </View>

        <View className="flex-1" />

        <Text className="text-sm text-center mb-4 px-4" style={{ color: "#40916C" }}>
          We will send you an email that will allow you to reset your password
        </Text>

        <Pressable
          onPress={handleResetPassword}
          disabled={loading}
          className="rounded-full py-4 items-center mb-6"
          style={{ backgroundColor: "#588157", opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Sending..." : "Reset Password"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}