import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { checkIsOnline } from "@/utils/network";
import { getAuthState } from "@/utils/guest";
import { getPlantDetailsBySlug, getDisplayName, PlantDetails } from "@/utils/plantClassifier";

export default function ScanResultScreen() {
  const params = useLocalSearchParams<{
    // Fresh scan, from Scanning screen:
    slug?: string;
    imageUri?: string;
    accuracy?: string;
    date?: string;
    time?: string;
    // Reopened saved scan, from History:
    scanId?: string;
  }>();

  const [plant, setPlant] = useState<PlantDetails | null>(null);
  const [plantSlug, setPlantSlug] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [hasBeenPosted, setHasBeenPosted] = useState(false);
  const [loading, setLoading] = useState(true);

  // True once loadData() has actually resolved a scan (fresh or reopened),
  // but couldn't find a matching entry in plant_info.json for its slug.
  // Distinguishes "found the scan, but the lookup failed" from a normal
  // still-loading state — the two look the same (plant === null) but
  // need different handling.
  const [notFound, setNotFound] = useState(false);

  // Display fields — populated either directly from params (fresh scan)
  // or from the fetched scans row (reopened from History).
  const [displayImageUri, setDisplayImageUri] = useState<string | null>(null);
  const [displayAccuracy, setDisplayAccuracy] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<string | null>(null);
  const [displayTime, setDisplayTime] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.slug, params.scanId]);

  async function loadData() {
    setLoading(true);
    setNotFound(false);

    // getAuthState() also recognises a local guest (no session at all),
    // which getUser() would have treated as a signed-in member.
    const { isGuest: guest } = await getAuthState();
    setIsGuest(guest);

    if (params.scanId) {
      // Reopened from History — fetch the saved scan row (need image_url,
      // date/time, accuracy from Supabase), but plant DETAILS still come
      // from the local plant_info.json via the saved plant_slug — no
      // Supabase plants table involved.
      const { data: scan, error } = await supabase
        .from("scans")
        .select("id, name, accuracy, date, time, image_url, plant_slug")
        .eq("id", params.scanId)
        .maybeSingle();

      if (error || !scan) {
        Alert.alert("Something went wrong", "Couldn't load this scan.");
        router.back();
        return;
      }

      setSavedScanId(scan.id);
      setDisplayImageUri(scan.image_url);
      setDisplayAccuracy(String(scan.accuracy));
      setDisplayDate(scan.date);
      setDisplayTime(scan.time);
      setPlantSlug(scan.plant_slug);
      setDisplayName(scan.name); // stored display name, no need to recompute

      // NOTE: this can come back null if plant_slug no longer has a
      // matching entry in plant_info.json — e.g. a class was renamed or
      // removed after this scan was saved. The row itself (photo, date,
      // accuracy) is still perfectly valid; only the reference lookup
      // failed. Handled below via the notFound fallback UI, instead of
      // silently leaving the screen stuck on the loading spinner.
      const details = getPlantDetailsBySlug(scan.plant_slug);
      setPlant(details);
      if (!details) setNotFound(true);

      // Check whether this scan already has a post, so we know whether
      // to show the Post button or just Delete.
      const { data: existingPost } = await supabase
        .from("posts")
        .select("id")
        .eq("scan_id", scan.id)
        .maybeSingle();
      setHasBeenPosted(!!existingPost);

      setLoading(false);
      return;
    }

    // Fresh scan — everything comes from local data + params, no network.
    if (!params.slug) {
      setLoading(false);
      return;
    }

    setDisplayImageUri(params.imageUri ?? null);
    setDisplayAccuracy(params.accuracy ?? null);
    setDisplayDate(params.date ?? null);
    setDisplayTime(params.time ?? null);
    setPlantSlug(params.slug);
    setDisplayName(getDisplayName(params.slug));

    const details = getPlantDetailsBySlug(params.slug);
    setPlant(details);
    if (!details) setNotFound(true);
    setLoading(false);
  }

  function promptSignUp() {
    Alert.alert(
      "Create an account",
      "Sign up or log in to save your scan results and share them with the community.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Sign up / Log in", onPress: () => router.push("/welcome") },
      ]
    );
  }

  /**
   * Pure save logic — no guest prompting, no "already saved" bail, no
   * navigation. Callers (Save button, Post, Go to Library) each decide
   * when this should run and what to do with the result.
   *
   * Returns the new scan id on success, or null on failure (and shows
   * its own error alert on failure, since every caller needs that).
   */
  async function performSave(): Promise<string | null> {
    if (!plant || !plantSlug || !displayImageUri) return null;

    setSaving(true);
    try {
      const { user } = await getAuthState();

      if (!user) return null;

      const upload = await uploadToCloudinary(displayImageUri, "scans");

      const { data: scan, error } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          plant_slug: plantSlug, // text, matches plant_info.json's key — not a Supabase FK
          name: displayName,
          accuracy: Number(displayAccuracy),
          date: displayDate,
          time: displayTime,
          image_url: upload.url,
          image_public_id: upload.publicId,
        })
        .select("id")
        .single();

      if (error || !scan) {
        throw error ?? new Error("Failed to save scan");
      }

      setSavedScanId(scan.id);
      return scan.id;
    } catch (err) {
      console.error("[scanresult] save failed:", err);
      Alert.alert("Something went wrong", "Couldn't save this scan. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  // Save button — explicit, manual save. On success, takes the user
  // straight to Home (per product decision), rather than staying on
  // this screen. If the save fails, performSave already alerted, so we
  // stay put and let them retry.
  async function handleSave() {
    if (isGuest) {
      promptSignUp();
      return;
    }
    if (savedScanId || saving) return;

    const online = await checkIsOnline();
    if (!online) {
      Alert.alert(
        "You're offline",
        "Connect to the internet to save this scan, then try again."
      );
      return;
    }

    const scanId = await performSave();
    if (scanId) {
      router.replace("/tab/home");
    }
  }

  // Post — always requires being online and logged in. Auto-saves first
  // if this scan hasn't been saved yet, then navigates.
  async function handlePost() {
    if (isGuest) {
      promptSignUp();
      return;
    }

    const online = await checkIsOnline();
    if (!online) {
      Alert.alert(
        "You're offline",
        "Connect to the internet to post this scan."
      );
      return;
    }

    let scanId = savedScanId;
    if (!scanId) {
      scanId = await performSave();
      if (!scanId) return; // save failed — performSave already alerted
    }

    if (!plant) return;

    router.push({
      pathname: "/createpost",
      params: { scanId },
    });
  }

  // Go to Library:
  // - Guest: never saves, just navigates.
  // - Logged in + online: auto-saves first (if not already saved), then navigates.
  // - Logged in + offline: skips saving entirely, just navigates using
  //   whatever is on screen right now.
  async function handleGoToLibrary() {
    if (!plantSlug) return;

    if (isGuest) {
      router.push({ pathname: "/plantdetail", params: { slug: plantSlug } });
      return;
    }

    if (!savedScanId) {
      const online = await checkIsOnline();
      if (online) {
        await performSave(); // best-effort; navigate either way
      }
      // offline: intentionally skip saving, fall through to navigate
    }

    router.push({ pathname: "/plantdetail", params: { slug: plantSlug } });
  }

  function handleDelete() {
    Alert.alert(
      "Delete this scan?",
      hasBeenPosted
        ? "This will remove it from your History. Any post you made from it will stay visible in the community."
        : "This will permanently remove it from your History.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete },
      ]
    );
  }

  async function confirmDelete() {
    if (!savedScanId || deleting) return;

    setDeleting(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to delete this scan.");
        return;
      }

      // Only removes the scans row — does NOT touch any post made from
      // it. Posts are self-contained copies (per the app's design), so
      // they stay visible in Community Feed even after the original
      // scan is deleted.
      const { error } = await supabase.from("scans").delete().eq("id", savedScanId);

      if (error) throw error;

      // NOTE: this does not delete the image from Cloudinary — that
      // requires a Supabase Edge Function (not built yet, parked for
      // later per utils/cloudinary.ts's deleteFromCloudinary stub).
      // The image becomes orphaned in Cloudinary storage for now.

      router.back();
    } catch (err) {
      console.error("[scanresult] delete failed:", err);
      Alert.alert("Something went wrong", "Couldn't delete this scan. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#D8F3DC" }}>
        <ActivityIndicator color="#1B4332" />
      </SafeAreaView>
    );
  }

  // plant_slug didn't resolve to anything in plant_info.json — most
  // likely because a class was renamed or removed after this scan was
  // saved (see the NOTE in loadData()). The scan row itself may still
  // be fine; only the reference lookup failed. Show a clear fallback
  // instead of a blank screen or an infinite spinner, and still let the
  // person delete the orphaned scan if it's a saved one.
  if (notFound || !plant) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />
        <View className="flex-row items-center mt-4 px-5">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-2xl" style={{ color: "#1B4332" }}>
              ←
            </Text>
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-lg font-bold text-center mb-2" style={{ color: "#1B4332" }}>
            Plant info unavailable
          </Text>
          <Text className="text-sm text-center" style={{ color: "#374151" }}>
            We couldn't find details for this scan. It may reference a plant
            that's no longer in the app's library.
          </Text>

          {savedScanId && (
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              className="rounded-full py-3 px-8 items-center mt-6"
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#DC2626",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <Text className="font-bold" style={{ color: "#DC2626" }}>
                {deleting ? "Deleting..." : "Delete this scan"}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Fresh, unsaved scans show a generic header; once a scan is saved
  // (either just now or reopened from History), the header shows the
  // plant's name instead — matches the mockups.
  const headerTitle = savedScanId ? displayName : "Scan Result";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mt-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-2xl" style={{ color: "#1B4332" }}>
              ←
            </Text>
          </Pressable>
          <Text
            className="flex-1 text-center text-xl font-bold mr-6"
            style={{ color: "#1B4332" }}
            numberOfLines={1}
          >
            {headerTitle}
          </Text>
        </View>

        <View
          className="rounded-2xl p-4 mt-4"
          style={{ backgroundColor: "#B7E4C7" }}
        >
          {/* Result card */}
          <View
            className="rounded-2xl p-3 flex-row items-center"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Image
              source={{ uri: displayImageUri ?? undefined }}
              style={{ width: 60, height: 60, borderRadius: 12 }}
            />
            <View className="ml-3 flex-1">
              <Text className="font-bold" style={{ color: "#1B4332" }}>
                {displayName} ({plant.scientific_name})
              </Text>
              <Text className="text-xs" style={{ color: "#374151" }}>
                Accuracy: {displayAccuracy}%
              </Text>
              <Text className="text-xs mt-1" style={{ color: "#6b7280" }}>
                Date: {displayDate}
              </Text>
              <Text className="text-xs" style={{ color: "#6b7280" }}>
                Time: {displayTime}
              </Text>
            </View>
          </View>

          {/* About */}
          {plant.about && (
            <View className="rounded-2xl p-3 mt-3" style={{ backgroundColor: "#FFFFFF" }}>
              <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
                About
              </Text>
              <Text className="text-sm" style={{ color: "#374151" }}>
                {plant.about}
              </Text>
            </View>
          )}

          {/* Benefits — array of strings, rendered as a bullet list */}
          {plant.benefits && plant.benefits.length > 0 && (
            <View className="rounded-2xl p-3 mt-3" style={{ backgroundColor: "#FFFFFF" }}>
              <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
                Benefits
              </Text>
              {plant.benefits.map((benefit, index) => (
                <Text key={index} className="text-sm" style={{ color: "#374151" }}>
                  • {benefit}
                </Text>
              ))}
            </View>
          )}

          {/* Preparation — array of strings, rendered as a bullet list */}
          {plant.preparation_methods && plant.preparation_methods.length > 0 && (
            <View className="rounded-2xl p-3 mt-3" style={{ backgroundColor: "#FFFFFF" }}>
              <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
                Preparation
              </Text>
              {plant.preparation_methods.map((method, index) => (
                <Text key={index} className="text-sm" style={{ color: "#374151" }}>
                  • {method}
                </Text>
              ))}
            </View>
          )}

          <Text className="text-xs text-center mt-3 px-2" style={{ color: "#374151" }}>
            For general information only, not medical advice. Consult a doctor
            before using any herbal remedy.
          </Text>

          {!savedScanId ? (
            <>
              {/* Save — shown before this scan has ever been saved.
                  On success, redirects the user to Home. */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className="rounded-full py-3 items-center mt-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#1B4332",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text className="font-bold" style={{ color: "#1B4332" }}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>

              {/* Go to Library — offered even before saving; behavior
                  branches on guest/online status inside the handler */}
              <Pressable
                onPress={handleGoToLibrary}
                disabled={saving}
                className="rounded-full py-3 items-center mt-3"
                style={{ backgroundColor: "#52796F", opacity: saving ? 0.6 : 1 }}
              >
                <Text className="text-white font-bold">Go to Library</Text>
              </Pressable>

              <Pressable
                onPress={handlePost}
                disabled={saving}
                className="rounded-full py-3 items-center mt-3"
                style={{ backgroundColor: "#1B4332", opacity: saving ? 0.6 : 1 }}
              >
                <Text className="text-white font-bold">{saving ? "Saving..." : "Post"}</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Go to Library — shown once saved, whether reopened from
                  History or just saved moments ago in this same session */}
              <Pressable
                onPress={handleGoToLibrary}
                className="rounded-full py-3 items-center mt-4"
                style={{ backgroundColor: "#52796F" }}
              >
                <Text className="text-white font-bold">Go to Library</Text>
              </Pressable>

              {/* Post — hidden once this scan already has a post */}
              {!hasBeenPosted && (
                <Pressable
                  onPress={handlePost}
                  disabled={saving}
                  className="rounded-full py-3 items-center mt-3"
                  style={{ backgroundColor: "#1B4332", opacity: saving ? 0.6 : 1 }}
                >
                  <Text className="text-white font-bold">{saving ? "Saving..." : "Post"}</Text>
                </Pressable>
              )}

              {/* Delete */}
              <Pressable
                onPress={handleDelete}
                disabled={deleting}
                className="rounded-full py-3 items-center mt-3"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#DC2626",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                <Text className="font-bold" style={{ color: "#DC2626" }}>
                  {deleting ? "Deleting..." : "Delete"}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}