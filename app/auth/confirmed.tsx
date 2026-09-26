// app/auth/confirmed.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/utils/supabase";

export default function ConfirmedScreen() {
  const [status, setStatus] = useState<"working" | "success" | "error">("working");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    handleIncomingLink();
  }, []);

  async function handleIncomingLink() {
    try {
      const url = await Linking.getInitialURL();
      if (!url) {
        setStatus("error");
        setErrorMsg("No confirmation data found.");
        return;
      }

      // PKCE flow — Supabase appends ?code=... to the redirect URL.
      const queryPart = url.split("?")[1]?.split("#")[0];
      const code = queryPart ? new URLSearchParams(queryPart).get("code") : null;

      if (!code) {
        setStatus("error");
        setErrorMsg("This confirmation link is invalid or has already been used.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      setStatus("success");
    } catch (err: any) {
      console.error("[confirmed] failed to establish session:", err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong confirming your email.");
    }
  }

  function goToLogin() {
    router.replace("/auth/login");
  }

  function goToHome() {
    router.replace("/tab/home");
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "#D8F3DC" }}>
      {status === "working" && (
        <>
          <ActivityIndicator size="large" color="#40916C" />
          <Text className="mt-4 text-base" style={{ color: "#1B4332" }}>
            Confirming your email...
          </Text>
        </>
      )}

      {status === "success" && (
        <>
          <Text className="text-xl font-bold mb-2" style={{ color: "#1B4332" }}>
            Email confirmed!
          </Text>
          <Text className="text-sm mb-6 text-center" style={{ color: "#1B4332" }}>
            Your account is ready. You can continue into the app now.
          </Text>
          <Pressable
            onPress={goToHome}
            className="rounded-full py-4 px-8 items-center"
            style={{ backgroundColor: "#40916C" }}
          >
            <Text className="text-white font-bold text-base">Continue</Text>
          </Pressable>
        </>
      )}

      {status === "error" && (
        <>
          <Text className="text-xl font-bold mb-2" style={{ color: "#1B4332" }}>
            Confirmation failed
          </Text>
          <Text className="text-sm mb-6 text-center" style={{ color: "#1B4332" }}>
            {errorMsg}
          </Text>
          <Pressable
            onPress={goToLogin}
            className="rounded-full py-4 px-8 items-center"
            style={{ backgroundColor: "#40916C" }}
          >
            <Text className="text-white font-bold text-base">Back to login</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}