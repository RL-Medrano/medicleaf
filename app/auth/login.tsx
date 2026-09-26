import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Checkbox from "expo-checkbox";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/utils/supabase";

const SAVED_EMAIL_KEY = "medicleaf_saved_email";
const SAVED_PASSWORD_KEY = "medicleaf_saved_password";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill from SecureStore if the user previously checked "Remember me".
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  async function loadSavedCredentials() {
    try {
      const savedEmail = await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
      const savedPassword = await SecureStore.getItemAsync(SAVED_PASSWORD_KEY);

      if (savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (err) {
      // SecureStore read failures shouldn't block the login screen from
      // rendering — just fall back to empty fields.
      console.error("[login] failed to load saved credentials:", err);
    }
  }

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        Alert.alert(
          "Couldn't sign in",
          "We couldn't sign you in. Please check your email and password, or if you signed up using Google, tap 'Continue with Google' instead."
        );
      } else if (error.message.includes("Email not confirmed")) {
        Alert.alert(
          "Verify your email",
          "Please check your inbox and tap the confirmation link before signing in."
        );
      } else {
        Alert.alert("Something went wrong", error.message);
      }
      return;
    }

    // Save or clear credentials based on the checkbox — checked saves
    // them (encrypted, via the device's secure keystore) so the fields
    // are pre-filled next time; unchecked clears anything saved before,
    // in case the user previously had it on and just turned it off.
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email);
        await SecureStore.setItemAsync(SAVED_PASSWORD_KEY, password);
      } else {
        await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
        await SecureStore.deleteItemAsync(SAVED_PASSWORD_KEY);
      }
    } catch (err) {
      // Non-fatal — sign-in already succeeded, just log it.
      console.error("[login] failed to save/clear credentials:", err);
    }

    router.replace("/tab/home");
  }

  function handleForgotPassword() {
    router.push("/auth/forgotpassword");
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <Pressable onPress={() => router.back()}>
          <Image
            source={require("@/assets/images/icons/back.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>

        <View className="items-center mt-2">
          <Image
            source={require("@/assets/images/logo/1.png")}
            style={{ width: 130, height: 130 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold mt-2" style={{ color: "#1B4332" }}>
            MedicLeaf
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="mt-10">
              <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="medicleaf@example.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="rounded-xl px-4 py-3 mb-4"
                style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
              />

              <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
                Password
              </Text>
              <View
                className="rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  style={{ flex: 1, color: "#1B4332" }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Image
                    source={
                      showPassword
                        ? require("@/assets/images/icons/eye_on.png")
                        : require("@/assets/images/icons/eye_off.png")
                    }
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              <View className="flex-row items-center mb-6">
                <Checkbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={rememberMe ? "#40916C" : undefined}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-sm" style={{ color: "#1B4332" }}>
                  Remember me
                </Text>
              </View>

              <Pressable
                onPress={handleSignIn}
                disabled={loading}
                className="rounded-full py-4 items-center mb-4"
                style={{ backgroundColor: "#40916C" }}
              >
                <Text className="text-white font-bold text-base">
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </Pressable>

              <Pressable onPress={handleForgotPassword}>
                <Text
                  className="font-semibold text-sm text-center underline"
                  style={{ color: "#2D6A4F" }}
                >
                  Forgot password
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}