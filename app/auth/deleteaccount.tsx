import React, { useState } from "react";
import { View, Text, Image, Pressable, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

// Must match the keys used by the login screen's "Remember me" feature.
const SAVED_EMAIL_KEY = "medicleaf_saved_email";
const SAVED_PASSWORD_KEY = "medicleaf_saved_password";

export default function DeleteAccountScreen() {
  const [loading, setLoading] = useState(false);

  async function performDelete() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You need to be signed in to delete your account.");
        return;
      }

      // functions.invoke attaches the current session's token automatically,
      // so no manual Authorization header is needed.
      const { error } = await supabase.functions.invoke("delete-account");

      if (error) {
        // For non-2xx responses supabase-js only gives a generic message,
        // so read the real one from the response body when it's available.
        let message = "Something went wrong deleting your account.";
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            if (body?.error) message = body.error;
          } catch {
            // Body wasn't JSON — keep the generic message.
          }
        } else if (error.message) {
          message = error.message;
        }
        alert(message);
        return;
      }

      // The account is gone, so wipe the "Remember me" credentials the login
      // screen may have saved. Non-fatal if it fails.
      try {
        await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
        await SecureStore.deleteItemAsync(SAVED_PASSWORD_KEY);
      } catch (err) {
        console.error("[deleteaccount] failed to clear saved credentials:", err);
      }

      // The user no longer exists on the server, so only clear the local
      // session — don't ask the server to revoke it.
      await supabase.auth.signOut({ scope: "local" });
      router.replace("/welcome");
    } catch (err) {
      console.error("[deleteaccount] delete failed:", err);
      alert("Something went wrong deleting your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeletePress() {
    Alert.alert(
      "Are you absolutely sure?",
      "This cannot be undone. All your data will be permanently erased.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]
    );
  }

  const deletedItems = [
    "Your profile information",
    "Scan history",
    "Posts and interaction with other users",
    "App settings and preferences",
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFFFF" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-1 px-6">
        <View className="flex-row items-center mt-2">
          <Pressable onPress={() => router.back()}>
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            className="flex-1 text-xl font-bold text-center"
            style={{ color: "#1B4332", marginRight: 24 }}
          >
            Delete Account
          </Text>
        </View>

        <View className="items-center mt-10">
          <Image
            source={require("@/assets/images/icons/trash.png")}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>

        <Text
          className="text-lg font-bold text-center mt-6"
          style={{ color: "#1B4332" }}
        >
          Delete Your Account?
        </Text>
        <Text
          className="text-sm text-center mt-2 px-2"
          style={{ color: "#6b7280" }}
        >
          This action is permanent and cannot be undone. All of your data,
          scan, and history will be permanently deleted.
        </Text>

        <View
          className="rounded-2xl p-4 mt-8"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <Text className="font-bold mb-2" style={{ color: "#DC2626" }}>
            What will be deleted?
          </Text>
          {deletedItems.map((item) => (
            <Text key={item} className="text-sm mb-1" style={{ color: "#374151" }}>
              • {item}
            </Text>
          ))}
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={handleDeletePress}
          disabled={loading}
          className="rounded-full py-4 items-center mb-8"
          style={{ backgroundColor: "#DC2626", opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Deleting..." : "Delete Account"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}