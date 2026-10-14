import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { checkIsOnline } from "@/utils/network";
import { getAuthState } from "@/utils/guest";
import * as Location from "expo-location";
import { getPlantDetailsBySlug, getDisplayName, PlantDetails } from "@/utils/plantClassifier";
import { invalidateScanHistory } from "@/utils/scanHistory";
import {
  type PhotoCoords,
  coordsFromParams,
  coordsToParams,
  getCaptureLocation,
} from "@/utils/photoLocation";

export default function ScanResultScreen() {
  const params = useLocalSearchParams<{
    // Fresh scan, from Scanning screen:
    slug?: string;
    imageUri?: string;
    accuracy?: string;
    date?: string;
    time?: string;
    // Where the photo came from and its capture-time location:
    imageSource?: string; // "camera" | "library"
    locationDenied?: string; // "1" when the user refused location permission
    photoLat?: string;
    photoLng?: string;
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
  const [activeTab, setActiveTab] = useState<"about" | "benefits" | "preparation">("about");
  const [aboutExpanded, setAboutExpanded] = useState(false);

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
  // The photo's own location — the capture-time GPS fix for a camera shot,
  // the EXIF GPS for a gallery upload. Null when the photo has none.
  const [photoCoords, setPhotoCoords] = useState<PhotoCoords | null>(null);
  // Set when a gallery upload carries no location: posting is blocked and
  // only Save / Go to Library are offered (see handlePost).
  const [blockedFromPosting, setBlockedFromPosting] = useState(false);
  // True when a camera photo carries no location purely because the user
  // refused location permission — Post asks them once more before refusing.
  const [locationDenied, setLocationDenied] = useState(false);
  // True while that second permission prompt / GPS fix is in flight.
  const [locating, setLocating] = useState(false);
  // Full-screen viewer — tapping the hero photo opens it here.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

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
      //
      // "*" rather than a column list so this keeps working before the
      // latitude/longitude columns exist on `scans` (see the note in
      // performSave) — a missing column would otherwise fail the whole read.
      const { data: scan, error } = await supabase
        .from("scans")
        .select("*")
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
      // Location stored when this scan was saved (may be null, and null
      // also before the columns exist).
      setPhotoCoords(
        coordsFromParams(
          scan.latitude == null ? null : String(scan.latitude),
          scan.longitude == null ? null : String(scan.longitude)
        )
      );
      setBlockedFromPosting(false);
      setLocationDenied(false);

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

    const coords = coordsFromParams(params.photoLat, params.photoLng);
    setPhotoCoords(coords);
    // A gallery upload without EXIF GPS can't be posted: its location can't
    // be recovered, and guessing (e.g. the device's position right now)
    // would pin the wrong place entirely. Posting is blocked instead —
    // Save and Go to Library keep working.
    setBlockedFromPosting(params.imageSource === "library" && coords == null);
    // Only a fresh scan can know WHY there's no location. A camera photo
    // with denied permission gets one more chance at Post time.
    setLocationDenied(params.locationDenied === "1");

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
   *
   * `coords` defaults to the photo's capture-time location; handlePost
   * passes a fix it obtained late (permission granted at Post time) so
   * that spot is the one persisted with the scan.
   */
  async function performSave(coords: PhotoCoords | null = photoCoords): Promise<string | null> {
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

      // Capture-time location rides along with the saved scan, so a later
      // Post — from History, even days later — pins the spot where the
      // photo was actually taken instead of wherever the user is now.
      //
      // Deliberately best-effort and separate from the insert above: it
      // only works once the latitude/longitude columns exist on `scans`.
      // Until then it fails quietly and the save still succeeds — the
      // location simply isn't persisted yet.
      if (coords) {
        await supabase
          .from("scans")
          .update({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .eq("id", scan.id);
      }

      setSavedScanId(scan.id);
      // History caches its list between focuses — tell it this save
      // changed things so the next open re-queries instead of showing
      // the old rows.
      invalidateScanHistory();
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
    // A gallery upload with no location can't be pinned honestly, so it
    // can't be posted at all — the only things left to do with it are
    // saving the scan or heading to the library.
    if (blockedFromPosting) {
      Alert.alert(
        "No location on this photo",
        "The image you're trying to post doesn't contain any location, so it can't be shared. You can still save this scan or go to the library.",
        [
          { text: "Save", onPress: handleSave },
          { text: "Go to Library", onPress: handleGoToLibrary },
        ]
      );
      return;
    }

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

    // The camera photo carries no location purely because permission was
    // refused on the Scan screen — so ask once more before posting.
    // Granted: a fix is taken right now and posted with (and stored on
    // the scan). Still denied: posting stays blocked until location
    // access is allowed.
    let postCoords = photoCoords;
    if (locationDenied && !postCoords) {
      setLocating(true);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Location permission needed",
            "Allow location access to post this scan result — without it there's no way to show where this plant was found. You can still save it or go to the library.",
            [
              { text: "Save", onPress: handleSave },
              { text: "Go to Library", onPress: handleGoToLibrary },
            ]
          );
          return;
        }

        const coords = await getCaptureLocation();
        if (!coords) {
          Alert.alert(
            "Couldn't get your location",
            "Location permission is on, but no location was found yet. Turn on GPS and try again, or save this scan instead."
          );
          return;
        }

        postCoords = coords;
        setPhotoCoords(coords); // keep the screen consistent if we stay
      } finally {
        setLocating(false);
      }
    }

    let scanId = savedScanId;
    if (!scanId) {
      scanId = await performSave(postCoords);
      if (!scanId) return; // save failed — performSave already alerted
    }

    if (!plant) return;

    // The photo's own location travels with it, so Create Post pins the
    // original spot instead of asking the device where it is right now.
    router.push({
      pathname: "/createpost",
      params: { scanId, ...coordsToParams(postCoords) },
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

      // Same deal as saving: the next History open must refetch.
      invalidateScanHistory();

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
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
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

  // Header always reads "Scan Result" — matches the mockup.
  const headerTitle = "Scan Result";

  const aboutText = plant?.about ?? "";
  const ABOUT_PREVIEW_LENGTH = 260;
  const aboutTruncated =
    aboutText.length > ABOUT_PREVIEW_LENGTH && !aboutExpanded
      ? aboutText.slice(0, ABOUT_PREVIEW_LENGTH).trimEnd()
      : aboutText;

  const tabDefs = [
    { key: "about", label: "About" },
    { key: "benefits", label: "Benefits" },
    { key: "preparation", label: "Preparation" },
  ] as const;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mt-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 26, height: 26, tintColor: "#1A1A1A" }}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            className="flex-1 text-center font-bold"
            style={{ color: "#1A1A1A", fontSize: 22, marginRight: 28 }}
            numberOfLines={1}
          >
            {headerTitle}
          </Text>
        </View>

        {/* Hero photo — tap to view full-screen */}
        <Pressable onPress={() => displayImageUri && setViewerUri(displayImageUri)}>
          <Image
            source={{ uri: displayImageUri ?? undefined }}
            style={{ width: "100%", height: 360, borderRadius: 24, marginTop: 16 }}
            resizeMode="cover"
          />
        </Pressable>

        {/* Name row — accuracy pill back per updated mockup
            ("Accuracy: 95%"); hidden only when no confidence value
            came through (e.g. a very old history entry). */}
        <View className="mt-4 flex-row items-center">
          <View className="flex-1 mr-3">
            <Text className="font-bold" style={{ color: "#1A1A1A", fontSize: 28 }}>
              {displayName}
            </Text>
            <Text className="mt-0.5" style={{ color: "#6b7280", fontSize: 15 }}>
              {plant.scientific_name}
            </Text>
          </View>
          {displayAccuracy !== null && (
            <View
              className="rounded-full"
              style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ color: "#374151", fontSize: 14, fontWeight: "600" }}>
                Accuracy: {displayAccuracy}%
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View
          className="flex-row items-center mt-4 p-1.5"
          style={{ backgroundColor: "#FFFFFF", borderRadius: 16 }}
        >
          {tabDefs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="flex-1 items-center py-3"
                style={{
                  backgroundColor: selected ? "#2F5233" : "transparent",
                  borderRadius: 12,
                }}
              >
                <Text
                  className={selected ? "font-bold" : "font-semibold"}
                  style={{
                    color: selected ? "#FFFFFF" : "#6b7280",
                    fontSize: 15,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab content card */}
        <View
          className="mt-4 p-5"
          style={{ backgroundColor: "#FFFFFF", borderRadius: 20, minHeight: 220 }}
        >
          {activeTab === "about" && (
            <>
              <Text className="font-bold mb-2" style={{ color: "#1A1A1A", fontSize: 17 }}>
                About
              </Text>
              {aboutText ? (
                <Text style={{ color: "#4b5563", fontSize: 15, lineHeight: 23 }}>
                  {aboutTruncated}
                  {aboutText.length > ABOUT_PREVIEW_LENGTH && !aboutExpanded && (
                    <Text
                      className="font-bold"
                      style={{ color: "#1A1A1A" }}
                      onPress={() => setAboutExpanded(true)}
                    >
                      ...More
                    </Text>
                  )}
                  {aboutExpanded && aboutText.length > ABOUT_PREVIEW_LENGTH && (
                    <Text
                      className="font-bold"
                      style={{ color: "#1A1A1A" }}
                      onPress={() => setAboutExpanded(false)}
                    >
                      {"  Less"}
                    </Text>
                  )}
                </Text>
              ) : (
                <Text style={{ color: "#4b5563", fontSize: 15 }}>
                  No description available for this plant yet.
                </Text>
              )}
            </>
          )}

          {activeTab === "benefits" && (
            <>
              <Text className="font-bold mb-2" style={{ color: "#1A1A1A", fontSize: 17 }}>
                Benefits
              </Text>
              {plant.benefits && plant.benefits.length > 0 ? (
                plant.benefits.map((benefit, index) => (
                  <View key={index} className="flex-row mt-1">
                    <Text style={{ color: "#4b5563", fontSize: 15, lineHeight: 23 }}>
                      {"\u2022  "}
                    </Text>
                    <Text className="flex-1" style={{ color: "#4b5563", fontSize: 15, lineHeight: 23 }}>
                      {benefit}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#4b5563", fontSize: 15 }}>
                  No benefits listed for this plant yet.
                </Text>
              )}
            </>
          )}

          {activeTab === "preparation" && (
            <>
              <Text className="font-bold mb-2" style={{ color: "#1A1A1A", fontSize: 17 }}>
                Preparation
              </Text>
              {plant.preparation_methods && plant.preparation_methods.length > 0 ? (
                plant.preparation_methods.map((method, index) => (
                  <Text
                    key={index}
                    style={{
                      color: "#4b5563",
                      fontSize: 15,
                      lineHeight: 23,
                      marginBottom: index < plant.preparation_methods!.length - 1 ? 10 : 0,
                    }}
                  >
                    {method}
                  </Text>
                ))
              ) : (
                <Text style={{ color: "#4b5563", fontSize: 15 }}>
                  No preparation guide for this plant yet.
                </Text>
              )}
            </>
          )}
        </View>

        {!savedScanId ? (
          <>
            {/* Go to Library */}
            <Pressable
              onPress={handleGoToLibrary}
              disabled={saving}
              className="items-center mt-4 py-4"
              style={{ backgroundColor: "#5F7E6E", borderRadius: 10, opacity: saving ? 0.6 : 1 }}
            >
              <Text className="font-medium" style={{ color: "#FFFFFF", fontSize: 16 }}>
                Go to Library
              </Text>
            </Pressable>

            {/* Save */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="items-center mt-3 py-4"
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1.5,
                borderColor: "#1E7A34",
                borderRadius: 10,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text className="font-medium" style={{ color: "#1E7A34", fontSize: 16 }}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePost}
              disabled={saving || locating}
              className="items-center mt-3 py-4"
              style={{
                backgroundColor: "#1E7A34",
                borderRadius: 10,
                opacity: saving || locating ? 0.6 : 1,
              }}
            >
              <Text className="font-medium" style={{ color: "#FFFFFF", fontSize: 16 }}>
                {saving ? "Saving..." : locating ? "Getting location..." : "Post"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Go to Library — shown once saved, whether reopened from
                History or just saved moments ago in this same session */}
            <Pressable
              onPress={handleGoToLibrary}
              className="items-center mt-4 py-4"
              style={{ backgroundColor: "#5F7E6E", borderRadius: 10 }}
            >
              <Text className="font-medium" style={{ color: "#FFFFFF", fontSize: 16 }}>
                Go to Library
              </Text>
            </Pressable>

            {/* Post — hidden once this scan already has a post */}
            {!hasBeenPosted && (
              <Pressable
                onPress={handlePost}
                disabled={saving || locating}
                className="items-center mt-3 py-4"
                style={{
                  backgroundColor: "#1E7A34",
                  borderRadius: 10,
                  opacity: saving || locating ? 0.6 : 1,
                }}
              >
                <Text className="font-medium" style={{ color: "#FFFFFF", fontSize: 16 }}>
                  {saving ? "Saving..." : locating ? "Getting location..." : "Post"}
                </Text>
              </Pressable>
            )}

            {/* Delete */}
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              className="items-center mt-3 py-4"
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1.5,
                borderColor: "#DC2626",
                borderRadius: 10,
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <Text className="font-medium" style={{ color: "#DC2626", fontSize: 16 }}>
                {deleting ? "Deleting..." : "Delete"}
              </Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Image viewer — tap the photo to see it full-screen; tap anywhere
          or press Android back to close. */}
      <Modal
        visible={viewerUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerUri(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.96)" }}>
          <Pressable
            onPress={() => setViewerUri(null)}
            hitSlop={12}
            style={{
              position: "absolute",
              top: insets.top + 10,
              right: 16,
              zIndex: 1,
            }}
          >
            <Image
              source={require("@/assets/images/icons/close.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => setViewerUri(null)}>
            {!!viewerUri && (
              <Image
                source={{ uri: viewerUri }}
                style={{ flex: 1, width: "100%" }}
                resizeMode="contain"
              />
            )}
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}