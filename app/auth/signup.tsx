import React, { useState } from "react";
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
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { enableTutorial } from "@/utils/tutorial";
import { TermsModal } from "@/components/TermsModal";

export default function SignupScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [termsVisible, setTermsVisible] = useState(false);

  // Step 1 fields
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [genderPickerOpen, setGenderPickerOpen] = useState(false);

  const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

  // Step 2 fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatDate(date: Date) {
    // Display format shown in the UI, e.g. "09/25/2000".
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  function handleBack() {
    if (step === 2) {
      setStep(1);
    } else {
      router.back();
    }
  }

  function handleContinueStep1() {
    if (!username.trim()) {
      Alert.alert("Missing info", "Please choose a username.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Missing info", "Please enter your first and last name.");
      return;
    }
    setStep(2);
  }

  async function handleCreateAccount() {
    // Trim once and reuse — a trailing space from keyboard autocomplete
    // would otherwise be sent to Supabase and rejected (or stored).
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert("Missing info", "Please enter your email address.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Terms required", "Please accept the terms and privacy policy.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please make sure both passwords match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to create an account.");
        return;
      }

      // Profile fields go in options.data (raw_user_meta_data) instead of a
      // separate insert — a DB trigger creates the profiles row from this
      // metadata, which works whether or not email confirmation is enabled.
      // See migrations/create_profile_on_signup_trigger.sql
      //
      // birthdate is stored as "YYYY-MM-DD" (ISO date), the unambiguous
      // format expected by a Postgres `date` column — the picker itself
      // gives us a JS Date object, converted here at submit time.
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username,
            firstname: firstName,
            lastname: lastName,
            birthdate: birthdate ? birthdate.toISOString().split("T")[0] : null,
            gender: gender || null,
          },
          emailRedirectTo: "medicleaf://auth/confirmed",
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          Alert.alert(
            "Account already exists",
            "That email is already registered. Try logging in instead."
          );
        } else {
          Alert.alert("Something went wrong", error.message);
        }
        return;
      }

      // Brand-new account → enroll it in the first-run Tutorial Guide on
      // Home. Stored per user id, so logging out and back in later doesn't
      // bring the guide back once it's finished. Runs before the email
      // confirmation check on purpose: the account exists either way, and
      // the flag only matters once this user reaches Home.
      if (data.user?.id) await enableTutorial(data.user.id);

      if (data.session) {
        // Confirm email is off (or was toggled off) — session issued
        // immediately, go straight in.
        router.replace("/tab/home");
      } else {
        // Confirm email is on — account created, but no session until they
        // click the link in their inbox. Don't navigate to Home; they're
        // not actually authenticated yet.
        Alert.alert(
          "Check your email",
          "We sent a confirmation link to your email. Please confirm your account, then log in.",
          [{ text: "OK", onPress: () => router.replace("/auth/login") }]
        );
      }
    } catch (err) {
      console.error("[signup] failed:", err);
      Alert.alert("Something went wrong", "Couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-1 px-6">
        <Pressable onPress={handleBack}>
          <Image
            source={require("@/assets/images/icons/back.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>

        <View className="items-center mt-2">
          <Image
            source={require("@/assets/images/logo/1.png")}
            style={{ width: 110, height: 110 }}
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
        {step === 1 ? (
          <View className="mt-6">
            <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
              User Name
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="User Name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoComplete="username"
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
            />

            <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
              First Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#9ca3af"
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
            />

            <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
              Last Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#9ca3af"
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
            />

            <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
              Date of Birth
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Text style={{ color: birthdate ? "#1B4332" : "#9ca3af" }}>
                {birthdate ? formatDate(birthdate) : "MM/DD/YYYY"}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={birthdate || new Date(2000, 0, 1)}
                mode="date"
                presentation="dialog"
                maximumDate={new Date()}
                onValueChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setBirthdate(selectedDate);
                }}
                onDismiss={() => setShowDatePicker(false)}
              />
            )}

            <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
              Gender
            </Text>
            <Pressable
              onPress={() => setGenderPickerOpen(!genderPickerOpen)}
              className="rounded-xl px-4 py-3 mb-1 flex-row items-center justify-between"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Text style={{ color: gender ? "#1B4332" : "#9ca3af" }}>
                {gender || "Select gender"}
              </Text>
              <Text style={{ color: "#1B4332" }}>{genderPickerOpen ? "▲" : "▼"}</Text>
            </Pressable>

            {genderPickerOpen && (
              <View
                className="rounded-xl mb-4 overflow-hidden"
                style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" }}
              >
                {GENDER_OPTIONS.map((option, index) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setGender(option);
                      setGenderPickerOpen(false);
                    }}
                    className="px-4 py-3"
                    style={{
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: "#F3F4F6",
                      backgroundColor: gender === option ? "#D8F3DC" : "#FFFFFF",
                    }}
                  >
                    <Text style={{ color: "#1B4332" }}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {!genderPickerOpen && <View className="mb-4" />}
          </View>
        ) : (
          <View className="mt-8">
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
              className="rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
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

            <View className="flex-row items-center mb-4">
              <Checkbox
                value={acceptedTerms}
                onValueChange={setAcceptedTerms}
                color={acceptedTerms ? "#40916C" : undefined}
                style={{ marginRight: 8 }}
              />
              <Text className="text-sm flex-1" style={{ color: "#1B4332" }}>
                I accept the{" "}
                <Text
                  onPress={() => setTermsVisible(true)}
                  style={{ color: "#2D6A4F", fontWeight: "700", textDecorationLine: "underline" }}
                >
                  Terms and Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        )}
        </ScrollView>

        <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />

        <Pressable
          onPress={step === 1 ? handleContinueStep1 : handleCreateAccount}
          disabled={loading}
          className="rounded-full py-4 items-center mb-6 mt-4"
          style={{ backgroundColor: "#40916C" }}
        >
          <Text className="text-white font-bold text-base">
            {step === 1
              ? "Continue"
              : loading
              ? "Creating account..."
              : "Create account"}
          </Text>
        </Pressable>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}