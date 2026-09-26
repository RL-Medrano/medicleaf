import React, { useState } from "react";
import { View, Text, Image, TextInput, Pressable, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";

export default function SetUsernameScreen() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (loading) return;
    const trimmed = username.trim();

    if (trimmed.length < 3) {
      Alert.alert("Username too short", "Username must be at least 3 characters.");
      return;
    }

    setLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to save your username.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Something went wrong", "Please try signing in again.");
        router.replace("/welcome");
        return;
      }

      const fullName = ((user.user_metadata?.full_name as string) || "").trim();
      const avatarUrl =
        (user.user_metadata?.avatar_url as string) ||
        (user.user_metadata?.picture as string) ||
        null;
      const [firstname, ...rest] = fullName.split(/\s+/);
      const lastname = rest.join(" ");

      // UPDATE, not INSERT — the DB trigger (create_profile_on_signup_trigger.sql)
      // already created this row the moment auth.users got the new user,
      // with username/firstname/lastname left null. This screen fills in
      // what the trigger couldn't know at signup time (Google's metadata
      // shape doesn't match, and email signups skip this screen entirely
      // since the trigger already had everything from the signup form).
      //
      // .select("id") asks for the updated rows back, so a silent no-op
      // (no matching row, or RLS blocking the update) can be detected.
      const { data: updated, error } = await supabase
        .from("profiles")
        .update({
          username: trimmed,
          firstname: firstname || null,
          lastname: lastname || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)
        .select("id");

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Username taken", "That username is already taken. Please choose another.");
        } else {
          Alert.alert("Something went wrong", error.message);
        }
        return;
      }

      if (!updated || updated.length === 0) {
        Alert.alert("Couldn't save", "Your profile could not be updated. Please try again.");
        return;
      }

      router.replace("/tab/home");
    } catch (err) {
      console.error("[setusername] save failed:", err);
      Alert.alert("Something went wrong", "Couldn't save your username. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <View className="items-center mt-16">
          <Image
            source={require("@/assets/images/icons/username.png")}
            style={{ width: 110, height: 110 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold mt-4" style={{ color: "#1B4332" }}>
            Choose a username
          </Text>
          <Text className="text-sm text-center mt-2 px-6" style={{ color: "#40916C" }}>
            This is how other MedicLeaf users will see you.
          </Text>
        </View>

        <View className="mt-10">
          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            Username
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. juandelacruz23"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
          />
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="rounded-full py-4 items-center mb-6"
          style={{ backgroundColor: "#40916C", opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Saving..." : "Continue"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}