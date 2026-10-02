import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@expo/ui/community/datetime-picker";
import { supabase } from "@/utils/supabase";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { checkIsOnline } from "@/utils/network";

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The avatar circle in the mockup is about half the screen width.
const AVATAR_SIZE = 170;

const MIN_BIRTH_YEAR_AGO = 120; // oldest selectable birthdate
const today = new Date();
const MAX_DATE = today; // can't be born in the future
const MIN_DATE = new Date(today.getFullYear() - MIN_BIRTH_YEAR_AGO, today.getMonth(), today.getDate());

// Storage is YYYY-MM-DD (a Postgres date column). Parsed from its parts
// (not `new Date(string)`) so it isn't shifted a day by timezone handling.
function dbDateToDate(value: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [, year, month, day] = m;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function dateToDb(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "May 19, 1999" — the format shown in the mockup.
function dateToDisplay(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function EditProfileScreen() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Only used on iOS: the spinner updates this as the user scrolls, and
  // it's only committed to `birthdate` when they tap Done — otherwise
  // every scroll tick would change the field before they've decided.
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [gender, setGender] = useState("");
  const [genderPickerOpen, setGenderPickerOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newLocalPhotoUri, setNewLocalPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Defense-in-depth: guests shouldn't be able to reach this screen at
    // all (Profile hides the menu entirely for them), but in case
    // someone deep-links here directly, bail out rather than silently
    // failing on an RLS-blocked update later.
    if (user.is_anonymous) {
      Alert.alert("Account required", "Please create an account to edit a profile.");
      router.back();
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("username, firstname, lastname, birthdate, gender, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setFullName(`${data.firstname ?? ""} ${data.lastname ?? ""}`.trim());
      setUsername(data.username ?? "");
      setBirthdate(dbDateToDate(data.birthdate));
      setGender(data.gender ?? "");
      setAvatarUrl(data.avatar_url);
    }

    setLoading(false);
  }

  function openDatePicker() {
    // Default the picker to a reasonable date (Jan 1, 2000) the first time,
    // rather than opening on today's date for someone with no birthdate yet.
    setPendingDate(birthdate ?? new Date(2000, 0, 1));
    setShowDatePicker(true);
  }

  // Android: presentation="dialog" opens its own dialog on mount and
  // fires onValueChange when confirmed. We unmount it (setShowDatePicker
  // false) either way, per @expo/ui's docs for this prop. onValueChange
  // only fires on an actual selection — cancellation is handled
  // separately below via onDismiss, so there's no "type" to branch on.
  function handleAndroidChange(_event: DateTimePickerChangeEvent, selected: Date) {
    setShowDatePicker(false);
    setBirthdate(selected);
  }

  function handleAndroidDismiss() {
    setShowDatePicker(false);
  }

  // iOS: presentation is ignored and the picker always renders inline, so
  // it's wrapped in our own modal below. It fires on every scroll tick,
  // staying open until the user taps Done (handled separately below).
  function handleIosChange(_event: DateTimePickerChangeEvent, selected: Date) {
    setPendingDate(selected);
  }

  function confirmIosDate() {
    setBirthdate(pendingDate);
    setShowDatePicker(false);
  }

  function cancelIosDate() {
    setShowDatePicker(false);
  }

  async function handleChangePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo library permission needed",
        "Please allow photo library access to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      // Preview immediately; the actual Cloudinary upload happens on
      // Save, not here — avoids uploading a photo the user might still
      // back out of changing.
      setAvatarUrl(result.assets[0].uri);
      setNewLocalPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert("Missing info", "Username cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to save your profile.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Only upload/replace the avatar if the user actually picked a new
      // photo this session — otherwise leave avatar_url/avatar_public_id
      // untouched. Saving the public_id (not just the URL) lets account
      // deletion clean this image up from Cloudinary later.
      let avatarFields: { avatar_url?: string; avatar_public_id?: string } = {};
      if (newLocalPhotoUri) {
        const upload = await uploadToCloudinary(newLocalPhotoUri, "avatars");
        avatarFields = { avatar_url: upload.url, avatar_public_id: upload.publicId };
      }

      const [firstname, ...rest] = fullName.trim().split(/\s+/);
      const lastname = rest.join(" ");

      const { data: updated, error: profileError } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          firstname: firstname || null,
          lastname: lastname || null,
          birthdate: birthdate ? dateToDb(birthdate) : null,
          gender: gender || null,
          ...avatarFields,
        })
        .eq("id", user.id)
        .select("id");

      if (profileError) {
        if (profileError.code === "23505") {
          Alert.alert("Username taken", "That username is already taken.");
        } else {
          Alert.alert("Something went wrong", profileError.message);
        }
        return;
      }

      // No error but no row changed: the profile row is missing or RLS
      // blocked the update. Don't act as though it saved.
      if (!updated || updated.length === 0) {
        Alert.alert("Couldn't save", "Your profile could not be updated. Please try again.");
        return;
      }

      router.back();
    } catch (err) {
      console.error("[editprofile] save failed:", err);
      Alert.alert("Something went wrong", "Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#D8F3DC" }}>
        <ActivityIndicator color="#1B4332" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-row items-center justify-between px-6 pt-2">
        <Pressable onPress={() => router.back()}>
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <Text className="text-xl font-bold" style={{ color: "#1B4332" }}>
          Edit Profile
        </Text>
        <Pressable onPress={handleSave} disabled={saving}>
          <Text className="font-bold" style={{ color: "#2D6A4F" }}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
      <ScrollView
        className="px-6 mt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Pressable onPress={handleChangePhoto} className="items-center">
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require("@/assets/images/icons/place_holder.png")
            }
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: "#D1D5DB",
            }}
          />
          <Text className="text-xs text-center mt-2" style={{ color: "#6b7280" }}>
            Tap the Profile icon to change your photo
          </Text>
        </Pressable>

        <View className="mt-6">
          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            Full Name
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
          />

          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            User Name
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
          />

          <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
            Date of Birth
          </Text>
          <Pressable
            onPress={openDatePicker}
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Text style={{ color: birthdate ? "#1B4332" : "#9ca3af" }}>
              {birthdate ? dateToDisplay(birthdate) : "MM/DD/YYYY"}
            </Text>
          </Pressable>

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
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Android: the system dialog is its own popup — just render the
          component while `showDatePicker` is true and it handles itself. */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={birthdate ?? new Date(2000, 0, 1)}
          mode="date"
          presentation="dialog"
          maximumDate={MAX_DATE}
          minimumDate={MIN_DATE}
          onValueChange={handleAndroidChange}
          onDismiss={handleAndroidDismiss}
        />
      )}

      {/* iOS: no system popup of its own, so it's wrapped in a small
          bottom-sheet-style modal with explicit Cancel/Done actions. */}
      {Platform.OS === "ios" && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <View
              className="rounded-t-2xl px-4 pt-2 pb-6"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <View className="flex-row justify-between items-center py-2">
                <Pressable onPress={cancelIosDate} hitSlop={8}>
                  <Text style={{ color: "#6b7280" }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmIosDate} hitSlop={8}>
                  <Text className="font-bold" style={{ color: "#2D6A4F" }}>
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="spinner"
                maximumDate={MAX_DATE}
                minimumDate={MIN_DATE}
                onValueChange={handleIosChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}