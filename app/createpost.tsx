/**
 * app/createpost.tsx
 *
 * The map lives in components/PinMap.tsx (shared with Edit Post). It
 * starts on the photo's own location — the capture-time GPS fix for a
 * camera shot, the EXIF GPS for a gallery upload — which travels with the
 * scan through router params (falling back to the latitude / longitude
 * stored on the scans row). A single tap anywhere on the map drops or
 * moves the pin (or adds the first one when the photo had no location at
 * all); double-tap opens the map full screen first. A Pin Location switch
 * under the map — always on at first — lets the user leave the location
 * out entirely: off hides the pin, ignores taps, blocks the full-screen
 * view, and saves no location.
 *
 * The device's current position is never used as a location: pinning
 * "wherever the user is now" would put a photo taken somewhere else days
 * ago on the wrong spot entirely. (It IS used, silently, as the empty
 * map's starting camera view — the phone's last known position, or a
 * Luzon-wide view when none is available — but that viewport is never
 * saved.) The caption and the pin are the only things the user can
 * change before posting.
 *
 * No API key needed — MapLibre is fully open-source, Geoapify tiles are
 * supplied via RasterSource using the URL template from utils/geoapify.ts.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  BackHandler,
  Modal,
  Switch,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/utils/supabase";
import { reverseGeocode } from "@/utils/geoapify";
import { markTutorialStep } from "@/utils/tutorial";
import { coordsFromParams, getLastKnownCenter } from "@/utils/photoLocation";
import PinMap, { LUZON_CENTER, LUZON_ZOOM } from "@/components/PinMap";

type ScanForPost = {
  id: string;
  name: string;
  image_url: string;
  image_public_id: string;
  latitude?: number | null;
  longitude?: number | null;
};

type Coordinates = { latitude: number; longitude: number };

export default function CreatePostScreen() {
  const { scanId, photoLat, photoLng } = useLocalSearchParams<{
    scanId: string;
    photoLat?: string;
    photoLng?: string;
  }>();

  const [scan, setScan] = useState<ScanForPost | null>(null);
  const [caption, setCaption] = useState("");
  const [pin, setPin] = useState<Coordinates | null>(null);
  // The phone's last known position — camera-only starting view for the
  // empty map (never attached to the post). Null → the Luzon view.
  const [userCenter, setUserCenter] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  // Set when the user taps the map to place or move the pin — it makes
  // the draft dirty like a typed caption does, so back never drops it.
  const [pinMoved, setPinMoved] = useState(false);
  // Pin Location switch — always ON when a post is created. The user
  // decides: leave it on so the post goes out with a location (the
  // photo's own spot or a tapped one), or switch it off to post without
  // one — off hides the pin, ignores map taps, blocks the full-screen
  // view, and saves no location.
  const [pinEnabled, setPinEnabled] = useState(true);
  const [posting, setPosting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Full-screen viewer — tapping the scan preview opens it here.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // The caption, the pin, and the Pin Location switch are the only
  // editable things on this screen — so they're all that make it dirty.
  const dirty = caption.trim().length > 0 || pinMoved || !pinEnabled;

  // Monotonic id for "the location the label belongs to". Every geocode
  // bumps it, and a result is only applied if it is still the newest one —
  // so a slow response can never leave a stale name next to a different
  // pin (which would save a location_name that doesn't match the stored
  // latitude/longitude).
  const locationSeq = useRef(0);

  useEffect(() => {
    loadScan();
  }, [scanId]);

  // Silent one-time read (permission checked, never requested) so an
  // empty map opens zoomed on the user instead of the whole country.
  useEffect(() => {
    let alive = true;
    getLastKnownCenter().then((c) => {
      if (alive && c) setUserCenter(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  // The hardware back button must ask before discarding the draft, exactly
  // like the header back button. Confirmation Modals intercept back
  // themselves while open, so this listener only runs over the form.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (posting) return true; // a post is in flight — let it finish
      if (confirmLeave) {
        setConfirmLeave(false);
        return true;
      }
      if (dirty) {
        setConfirmLeave(true);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [dirty, confirmLeave, posting]);

  async function loadScan() {
    if (!scanId) return;

    // "*" rather than a column list so a scan saved before the
    // latitude/longitude columns exist on `scans` can't fail this read.
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .maybeSingle();

    if (error || !data) {
      Alert.alert("Something went wrong", "Couldn't load this scan.");
      router.back();
      return;
    }

    setScan(data);

    // The pin is the PHOTO's location — never the device's current one.
    // Fresh scans pass theirs through router params; a scan reopened from
    // History falls back to whatever was stored on the row when saved.
    const coords =
      coordsFromParams(photoLat, photoLng) ??
      coordsFromParams(
        data.latitude == null ? null : String(data.latitude),
        data.longitude == null ? null : String(data.longitude)
      );

    if (coords) {
      setPin(coords);
      resolveLocationName(coords);
    }
  }

  /**
   * Reverse-geocodes `coords` into `locationName`, keyed on locationSeq so
   * only the most recent request may write state. The label is cleared
   * first, so a stale label is never shown (or posted) next to a new pin.
   */
  async function resolveLocationName(coords: Coordinates) {
    const seq = ++locationSeq.current;
    setGeocoding(true);
    setLocationName(null);

    try {
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude);
      if (seq !== locationSeq.current) return; // a newer pin is being labelled
      setLocationName(geocoded.formatted);
    } catch (err) {
      if (seq !== locationSeq.current) return;
      console.error("[createpost] reverse geocode failed:", err);
      setLocationName("Unknown location");
    } finally {
      if (seq === locationSeq.current) setGeocoding(false);
    }
  }

  /**
   * Single tap on the map (inline or full screen) drops or moves the pin —
   * including the very first one when the photo arrived without a
   * location. The label is re-resolved for it, with locationSeq dropping
   * any stale response, and the draft becomes dirty so back can't drop
   * the move silently.
   */
  function handlePinChange(coords: Coordinates) {
    setPin(coords);
    setPinMoved(true);
    resolveLocationName(coords);
  }

  // Leaving is only allowed straight away when nothing is pending —
  // otherwise the confirmation popup gets the final say.
  function handleBack() {
    if (posting) return; // a post is in flight — let it finish
    if (dirty) setConfirmLeave(true);
    else router.back();
  }

  async function handlePost() {
    if (!scan || posting) return;

    // Never save a pin while its label is still being resolved — the
    // location_name must always match the latitude/longitude stored with
    // it. With Pin Location off nothing location-related is saved at all,
    // so there's nothing to wait for.
    if (pinEnabled && pin && geocoding) {
      Alert.alert(
        "Naming this spot",
        "Hang on a moment while we name this location, then tap Post again."
      );
      return;
    }

    setPosting(true);
    try {
      // Local session read — the insert below is still RLS-enforced, so a
      // dead token fails there with a clear error instead of costing an
      // Auth-server call up front.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        Alert.alert("Please log in", "You need an account to post.");
        return;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        scan_id: scan.id,
        name: scan.name,
        caption: caption.trim() || null,
        image_url: scan.image_url,
        image_public_id: scan.image_public_id,
        // The photo's own spot at first (capture/pick time), or whatever
        // the user taps on the map when it had none. Null when no pin was
        // placed — and also when Pin Location is switched off, which
        // deliberately drops even a pre-filled pin.
        latitude: pinEnabled && pin ? pin.latitude : null,
        longitude: pinEnabled && pin ? pin.longitude : null,
        location_name: pinEnabled && pin ? locationName : null,
      });

      if (error) throw error;

      // First-run tutorial: publishing a post completes "Scan & Post".
      await markTutorialStep("scanpost");

      router.replace("/tab/community");
    } catch (err) {
      console.error("[createpost] post failed:", err);
      Alert.alert("Something went wrong", "Couldn't create this post. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  if (!scan) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#D8F3DC" }}>
        <ActivityIndicator color="#1B4332" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mt-4">
          <Pressable onPress={handleBack} hitSlop={12}>
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            className="flex-1 text-center text-xl font-bold"
            style={{ color: "#1B4332", marginRight: 24 }}
          >
            Create Post
          </Text>
        </View>

        <View className="rounded-2xl p-4 mt-4" style={{ backgroundColor: "#FFFFFF" }}>
          {/* Scan preview — tap to view full-screen */}
          <View className="flex-row items-center">
            <Pressable onPress={() => setViewerUri(scan.image_url)}>
              <Image
                source={{ uri: scan.image_url }}
                style={{ width: 64, height: 64, borderRadius: 12 }}
              />
            </Pressable>
            <Text className="font-bold ml-3" style={{ color: "#1B4332" }}>
              {scan.name}
            </Text>
          </View>

          {/* Caption */}
          <Text className="font-semibold mt-4 mb-2" style={{ color: "#1B4332" }}>
            Say something
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Share something about this find..."
            placeholderTextColor="#9ca3af"
            multiline
            className="rounded-xl p-3"
            style={{
              backgroundColor: "#F3F4F6",
              minHeight: 90,
              textAlignVertical: "top",
              color: "#1B4332",
            }}
          />

          {/* Location — starts at the photo's own spot; a tap anywhere on
              the map drops or moves the pin (or places the first one when
              the photo had no location). Pin Location off = the map stays
              on screen, but taps and the full-screen view are blocked. */}
          <Text className="font-semibold mt-4 mb-2" style={{ color: "#1B4332" }}>
            Where did you find it?
          </Text>
          <Text className="text-xs mb-2" style={{ color: "#6b7280" }}>
            {pinEnabled
              ? pin
                ? "Tap the map to move the pin — double-tap to view it full screen"
                : "Tap the map to place the pin — double-tap to view it full screen"
              : "Pin Location is off — this post won't include a location."}
          </Text>

          <PinMap
            coord={pin}
            fallbackCenter={userCenter ?? LUZON_CENTER}
            onPinChange={pinEnabled ? handlePinChange : undefined}
            zoom={pin || userCenter ? 14 : LUZON_ZOOM}
            height={220}
            borderRadius={16}
            showPin={pinEnabled}
            disabled={!pinEnabled}
            allowFullView={pinEnabled}
          />

          {/* Pin Location switch — always starts on; the user decides
              whether the post carries a location. */}
          <View className="flex-row items-center mt-3">
            <Switch
              value={pinEnabled}
              onValueChange={setPinEnabled}
              trackColor={{ false: "#D1D5DB", true: "#40916C" }}
              thumbColor="#FFFFFF"
            />
            <Text className="ml-3" style={{ color: "#6b7280", fontSize: 13 }}>
              Pin Location
            </Text>
          </View>

          {pinEnabled ? (
            pin ? (
              locationName ? (
                <View className="flex-row items-center mt-2">
                  <Image
                    source={require("@/assets/images/icons/pin.png")}
                    style={{ width: 13, height: 13 }}
                    resizeMode="contain"
                  />
                  <Text className="text-xs ml-1" style={{ color: "#374151" }}>
                    {locationName}
                  </Text>
                </View>
              ) : geocoding ? (
                <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
                  Naming this spot...
                </Text>
              ) : null
            ) : (
              <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
                This photo doesn't have a location — tap the map to add one.
              </Text>
            )
          ) : null}

          {/* Post */}
          <Pressable
            onPress={handlePost}
            disabled={posting || (pinEnabled && pin && geocoding)}
            className="rounded-full py-3 items-center mt-6"
            style={{
              backgroundColor: "#1B4332",
              opacity: posting || (pinEnabled && pin && geocoding) ? 0.6 : 1,
            }}
          >
            <Text className="text-white font-bold">
              {posting
                ? "Posting..."
                : pinEnabled && pin && geocoding
                  ? "Naming this spot..."
                  : "Post"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Unsaved-changes confirmation — shown instead of leaving straight
          away when the header back button (or the hardware back button)
          is pressed with a draft still on screen. */}
      <Modal
        visible={confirmLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLeave(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>You haven't posted yet</Text>
            <Text style={styles.dialogBody}>
              If you go back now, everything you entered here will be lost.
            </Text>

            <Pressable
              onPress={() => setConfirmLeave(false)}
              className="rounded-xl items-center justify-center"
              style={styles.keepEditingButton}
            >
              <Text style={styles.keepEditingText}>Keep editing</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              className="rounded-xl items-center justify-center"
              style={styles.disregardButton}
            >
              <Text style={styles.disregardText}>Disregard changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Image viewer — tap the preview to see it full-screen; tap
          anywhere or press Android back to close. */}
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 20,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B4332",
    textAlign: "center",
  },
  dialogBody: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  keepEditingButton: {
    marginTop: 20,
    height: 44,
    backgroundColor: "#137425",
  },
  keepEditingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  disregardButton: {
    marginTop: 10,
    height: 44,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },
  disregardText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
