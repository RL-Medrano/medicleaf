import React, { useEffect, useState } from "react";
import { View, Text, Image, TextInput, Pressable, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";

export default function ChangePasswordScreen() {
  const params = useLocalSearchParams<{ code?: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    verifyAccess();
  }, []);

  async function verifyAccess() {
    // Case 1: arriving from the password-reset email link — it carries
    // a one-time "code" that must be exchanged for a session before
    // updateUser() will work.
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      setVerifying(false);

      if (error) {
        Alert.alert(
          "Link expired",
          "This reset link is invalid or has expired. Please request a new one."
        );
        router.replace("/auth/forgotpassword");
        return;
      }

      setReady(true);
      return;
    }

    // Case 2: arriving from Profile → Change Password while already
    // logged in — a session should already exist, no code needed.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setVerifying(false);

    if (!session) {
      Alert.alert("Session expired", "Your session has expired. Please sign in again.");
      router.replace("/auth/login");
      return;
    }

    setReady(true);
  }

  async function handleConfirm() {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing info", "Please fill in both fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to change your password.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert("Something went wrong", error.message);
        return;
      }

      Alert.alert("Password updated", "Your password has been updated. Please sign in again.", [
        {
          text: "OK",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/welcome");
          },
        },
      ]);
    } catch (err) {
      console.error("[changepassword] update failed:", err);
      Alert.alert("Something went wrong", "Couldn't update your password. Please try again.");
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
        <Text style={{ color: "#1B4332" }}>Verifying...</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return null; // already redirected in verifyAccess()
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
          {params.code ? "Reset Password" : "Change Password"}
        </Text>
        <Text className="text-sm mt-2" style={{ color: "#40916C" }}>
          {params.code ? "Please create your new password" : "Please enter your new password"}
        </Text>

        <View className="mt-8">
          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            New Password
          </Text>
          <View
            className="rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoComplete="password-new"
              style={{ flex: 1, color: "#1B4332" }}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
              <Image
                source={
                  showNewPassword
                    ? require("@/assets/images/icons/eye_on.png")
                    : require("@/assets/images/icons/eye_off.png")
                }
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            Confirm Password
          </Text>
          <View
            className="rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              style={{ flex: 1, color: "#1B4332" }}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Image
                source={
                  showConfirmPassword
                    ? require("@/assets/images/icons/eye_on.png")
                    : require("@/assets/images/icons/eye_off.png")
                }
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={handleConfirm}
          disabled={loading}
          className="rounded-full py-4 items-center mb-6"
          style={{ backgroundColor: "#1B4332", opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Updating..." : "Confirm"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}