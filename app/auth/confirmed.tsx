// app/auth/confirmed.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { nextRouteAfterSignIn } from "@/utils/pin";

export default function ConfirmedScreen() {
  // Read ?code= off the route itself rather than Linking.getInitialURL().
  // getInitialURL() only reports the URL that LAUNCHED the app — so when
  // MedicLeaf is already sitting in memory (the normal case here, since
  // they just signed up on this very device) it comes back null and the
  // exchange never runs. expo-router supplies the params for warm and cold
  // starts alike, which is how changepassword.tsx already does it.
  const params = useLocalSearchParams<{ code?: string }>();

  const [status, setStatus] = useState<"working" | "success" | "error">("working");
  const [errorMsg, setErrorMsg] = useState("");
  // The code is single-use — make sure a re-render can't burn it twice.
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;

    if (!params.code) {
      setStatus("error");
      setErrorMsg("This confirmation link is invalid or has already been used.");
      return;
    }

    exchangedRef.current = true;
    exchangeCode(params.code);
  }, [params.code]);

  async function exchangeCode(code: string) {
    try {
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

  async function goToHome() {
    // A freshly confirmed sign-up has no PIN yet, so this opens the create
    // screen instead of dropping a brand-new account into Home.
    router.replace(await nextRouteAfterSignIn());
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      {/* Centering moved onto the scroll content, so the screen still
          looks centered on normal phones but can grow + scroll on very
          short screens or with a large system font size. */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
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
      </ScrollView>
    </SafeAreaView>
  );
}