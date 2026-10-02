import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  Alert,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/utils/supabase";

// Set EXPO_PUBLIC_WEB3FORMS_KEY in your .env.local file
const WEB3FORMS_ACCESS_KEY = process.env.EXPO_PUBLIC_WEB3FORMS_KEY ?? "";

export default function HelpSupportScreen() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!WEB3FORMS_ACCESS_KEY) {
      Alert.alert("Error", "Support form is not configured.");
      return;
    }

    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing information", "Please fill in both the title and the problem.");
      return;
    }

    setSending(true);
    try {
      // Include who sent it so you can identify the user in the email
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `[Support] ${title.trim()}`,
          from_name: "App Support",
          title: title.trim(),
          message: message.trim(),
          user_email: user?.email ?? "Guest",
          user_id: user?.id ?? "N/A",
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to send");

      setTitle("");
      setMessage("");
      Alert.alert("Sent", "Thank you! We received your report.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(
        "Could not send",
        "Please check your internet connection and try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#DDFFDC" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#DDFFDC" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-center py-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{ position: "absolute", left: 0 }}
            >
              <Image
                source={require("@/assets/images/icons/arrow_left.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </Pressable>
            <Text className="text-lg font-bold" style={{ color: "#000" }}>
              Help & Support
            </Text>
          </View>

          <Text
            className="mt-8 text-sm"
            style={{ color: "#6b7280", textAlign: "justify" }}
          >
            If you are having problem or any issues within the application, please
            let us know. We will try to solve them as soon as possible.
          </Text>

          <Text className="mt-6 mb-2 text-base" style={{ color: "#1a1a1a" }}>
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            className="rounded-xl px-4"
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              height: 44,
            }}
          />

          <Text className="mt-6 mb-2 text-base" style={{ color: "#1a1a1a" }}>
            Explain the problem
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            maxLength={2000}
            className="rounded-xl p-4"
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              height: 300,
            }}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={sending}
            className="rounded-xl items-center justify-center mt-10"
            style={{
              backgroundColor: "#5E8C56",
              height: 54,
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-lg font-bold" style={{ color: "#fff" }}>
                Submit
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}