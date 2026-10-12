import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { PinInput } from "@/components/PinInput";
import { isValidPin, verifyPin, hasPin, markPinVerified, clearPinVerified } from "@/utils/pin";

// Cut the session and return to the login form after this many wrong PINs,
// so someone holding a stolen phone can't sit there guessing indefinitely.
const MAX_ATTEMPTS = 3;

export default function VerifyPinScreen() {
  // Passed by login.tsx. Optional because the splash screen also lands
  // here (app reopened mid-login) with no params at all.
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? "");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  // Kept in a ref rather than state so a fast second submit can't read a
  // stale counter and let someone squeeze in extra guesses.
  const attemptsRef = useRef(0);

  // People can end up here without a PIN ever existing — a Google account
  // that never set one, or an email sign-up that went through confirmation
  // and skipped createpin. Verifying against a PIN that doesn't exist would
  // reject every entry forever, so detect it and swap to the create screen.
  useEffect(() => {
    hasPin()
      .then((exists) => {
        if (!exists) router.replace("/auth/createpin");
      })
      .catch((err) => {
        // Leave the gate up: the verify call below will surface the real
        // problem (e.g. user_pins.sql was never applied) if there is one.
        console.error("[verifypin] PIN existence check failed:", err);
      });
  }, []);

  // Splash-screen arrivals have no email — read it off the session, which
  // is what put them here in the first place.
  useEffect(() => {
    if (email) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? ""))
      .catch(() => {});
  }, [email]);

  function goToLogin() {
    router.replace("/auth/login");
  }

  async function handleVerify() {
    if (!isValidPin(pin)) {
      Alert.alert("Invalid PIN", "Please enter your 6-digit PIN.");
      return;
    }

    setLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to verify your PIN.");
        return;
      }

      const ok = await verifyPin(pin);

      if (!ok) {
        const next = attemptsRef.current + 1;
        attemptsRef.current = next;
        setPin("");

        const left = MAX_ATTEMPTS - next;
        Alert.alert(
          "Wrong PIN",
          left <= 0
            ? `That's ${MAX_ATTEMPTS} wrong attempts. Please sign in again.`
            : `${left} attempt${left === 1 ? "" : "s"} left before you're asked to sign in again.`
        );

        if (left <= 0) {
          // End the session for real. Merely showing the login form would
          // leave the session alive, so reopening the app would return
          // here with the counter reset — and guessing would never end.
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error("[verifypin] signOut after failed attempts:", err);
          }
          await clearPinVerified();
          goToLogin();
        }
        return;
      }

      // Record it locally so reopening the app doesn't re-prompt, then
      // hand over to Home.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await markPinVerified(session.user.id);

      router.replace("/tab/home");
    } catch (err) {
      console.error("[verifypin] verify failed:", err);
      Alert.alert("Something went wrong", "Couldn't verify your PIN. Please try again.");
    } finally {
      setLoading(false);
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
            Enter your PIN
          </Text>
          <Text className="text-sm text-center mt-2 px-4" style={{ color: "#40916C" }}>
            Enter the 6-digit PIN for {email || "your account"} to continue.
          </Text>
        </View>

        <View className="mt-10">
          <PinInput value={pin} onChange={setPin} />

          <Pressable
            onPress={handleVerify}
            disabled={loading}
            className="rounded-full py-4 items-center mb-5"
            style={{ backgroundColor: "#40916C", opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Verifying..." : "Verify"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push("/auth/forgotpin")}>
            <Text
              className="font-semibold text-sm text-center underline"
              style={{ color: "#2D6A4F" }}
            >
              Forgot PIN?
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
