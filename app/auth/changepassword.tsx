import React, { useEffect, useState } from "react";
import { View, Text, Image, TextInput, Pressable, StatusBar, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { clearPinVerified } from "@/utils/pin";

export default function ChangePasswordScreen() {
  const params = useLocalSearchParams<{ code?: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [ready, setReady] = useState(false);

  // Step 1 (old password) is the Profile route. The email-reset link
  // already proved the user via the emailed code, so it starts at step 2.
  const [step, setStep] = useState<1 | 2>(params.code ? 2 : 1);
  const [oldPassword, setOldPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [checkingOld, setCheckingOld] = useState(false);

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

  /**
   * Step 1 (Profile route): prove the old password before showing the form
   * that actually changes it. Supabase's updateUser() has no "current
   * password" field, so the proof is a real sign-in with the old password —
   * success rotates the session tokens (harmless), a wrong password comes
   * back as the generic "Invalid login credentials".
   */
  async function handleConfirmOld() {
    if (!oldPassword) {
      Alert.alert("Missing info", "Please enter your old password.");
      return;
    }

    setCheckingOld(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to confirm your password.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        Alert.alert("Session expired", "Your session has expired. Please sign in again.");
        router.replace("/auth/login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: oldPassword,
      });

      if (error) {
        // Repeated wrong tries hit a server-side rate limit, which answers
        // with its own message — don't hide that behind the friendly text.
        const rateLimited = /rate limit|security purposes/i.test(error.message ?? "");
        Alert.alert(
          rateLimited ? "Too many attempts" : "Incorrect password",
          rateLimited
            ? error.message
            : "Please check your old password and try again."
        );
        return;
      }

      // Verified — drop the typed old password and move on. Step 2's back
      // arrow returns here in case they want to re-enter it.
      setOldPassword("");
      setShowOldPassword(false);
      setStep(2);
    } catch (err) {
      console.error("[changepassword] old-password check failed:", err);
      Alert.alert("Something went wrong", "Couldn't confirm your password. Please try again.");
    } finally {
      setCheckingOld(false);
    }
  }

  function handleBack() {
    // Step 2 was reached from step 1 inside this screen (Profile route),
    // so back returns to the old-password check instead of leaving.
    if (step === 2 && !params.code) {
      setStep(1);
      return;
    }
    router.back();
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
            // A changed password is a security event — make the next sign-in
            // re-prove the PIN rather than trusting the stored flag.
            await clearPinVerified();
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

  // ── Step 1: old-password check (Profile route only) ──────────────────
  if (step === 1) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Pressable onPress={handleBack}>
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>

          <Text className="text-4xl font-bold mt-4" style={{ color: "#1A1A1A" }}>
            Confirm Password
          </Text>
          <Text className="text-sm mt-2" style={{ color: "#6b7280" }}>
            Please enter your old password
          </Text>

          <View className="mt-8">
            <Text className="font-bold mb-2" style={{ color: "#1A1A1A" }}>
              Old Password
            </Text>
            <View
              className="rounded-xl px-4 py-3.5 flex-row items-center justify-between"
              style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" }}
            >
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
                // "password" (not "password-new") so the keyboard offers
                // the saved password for autofill of the OLD one.
                autoComplete="password"
                placeholder="Enter old password"
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, color: "#1A1A1A", padding: 0 }}
              />
              <Pressable
                onPress={() => setShowOldPassword(!showOldPassword)}
                hitSlop={10}
                className="ml-3"
              >
                <Image
                  source={
                    showOldPassword
                      ? require("@/assets/images/icons/eye_on.png")
                      : require("@/assets/images/icons/eye_off.png")
                  }
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            {/* Escape hatch: forgot the old password → prove via the reset
                email instead; the emailed link re-opens this screen at
                step 2 ("Reset Password") without needing it. */}
            <Pressable
              onPress={() => router.push("/auth/forgotpassword")}
              hitSlop={8}
              className="mt-3 self-start"
            >
              <Text className="font-semibold text-sm underline" style={{ color: "#2D6A4F" }}>
                Forgot password
              </Text>
            </Pressable>
          </View>

          <View className="flex-1" />

          <Pressable
            onPress={handleConfirmOld}
            disabled={checkingOld}
            className="rounded-2xl py-4 items-center mb-6"
            style={{ backgroundColor: "#1B5E20", opacity: checkingOld ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold text-base">
              {checkingOld ? "Checking..." : "Confirm"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: set the new password (Profile route and email-reset link) ─
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Pressable onPress={handleBack}>
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>

        <Text className="text-4xl font-bold mt-4" style={{ color: "#1A1A1A" }}>
          {params.code ? "Reset Password" : "Change Password"}
        </Text>
        <Text className="text-sm mt-2" style={{ color: "#6b7280" }}>
          {params.code ? "Please create your new password" : "Please enter your new password"}
        </Text>

        <View className="mt-8">
          <Text className="font-bold mb-2" style={{ color: "#1A1A1A" }}>
            New Password
          </Text>
          <View
            className="rounded-xl px-4 py-3.5 mb-5 flex-row items-center justify-between"
            style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoComplete="password-new"
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              style={{ flex: 1, color: "#1A1A1A", padding: 0 }}
            />
            <Pressable
              onPress={() => setShowNewPassword(!showNewPassword)}
              hitSlop={10}
              className="ml-3"
            >
              <Image
                source={
                  showNewPassword
                    ? require("@/assets/images/icons/eye_on.png")
                    : require("@/assets/images/icons/eye_off.png")
                }
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <Text className="font-bold mb-2" style={{ color: "#1A1A1A" }}>
            Confirm Password
          </Text>
          <View
            className="rounded-xl px-4 py-3.5 mb-4 flex-row items-center justify-between"
            style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" }}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              style={{ flex: 1, color: "#1A1A1A", padding: 0 }}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={10}
              className="ml-3"
            >
              <Image
                source={
                  showConfirmPassword
                    ? require("@/assets/images/icons/eye_on.png")
                    : require("@/assets/images/icons/eye_off.png")
                }
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={handleConfirm}
          disabled={loading}
          className="rounded-2xl py-4 items-center mb-6"
          style={{ backgroundColor: "#1B5E20", opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Updating..." : "Confirm"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}