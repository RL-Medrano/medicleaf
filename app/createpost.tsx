/**
 * app/createpost.tsx
 *
 * The map itself lives in components/PinMap.tsx (shared with Edit Post) —
 * single tap drops the pin, double tap opens it full screen. This screen
 * only owns the pin state, the reverse geocode of that pin, and posting.
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
  Switch,
  Alert,
  ActivityIndicator,
  BackHandler,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { supabase } from "@/utils/supabase";
import { reverseGeocode } from "@/utils/geoapify";
import { markTutorialStep } from "@/utils/tutorial";
import PinMap from "@/components/PinMap";

type ScanForPost = {
  id: string;
  name: string;
  image_url: string;
  image_public_id: string;
};

type Coordinates = { latitude: number; longitude: number };

export default function CreatePostScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();

  const [scan, setScan] = useState<ScanForPost | null>(null);
  const [caption, setCaption] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [pin, setPin] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [posting, setPosting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pinPicked, setPinPicked] = useState(false);
  const [pinToggleTouched, setPinToggleTouched] = useState(false);

  // Has the user actually put work on this screen? A caption they typed, a
  // pin they dropped on the map themselves, or a flip of the Pin Location
  // switch. (The GPS pin is filled in automatically when the screen opens,
  // so on its own it is not "unsaved work".)
  const dirty = caption.trim().length > 0 || pinPicked || pinToggleTouched;

  // Monotonic id for "the location the label belongs to". Every GPS fix and
  // every map tap bumps it, and a geocode result is only applied if it is
  // still the newest one — so a slow response can never overwrite the label
  // of a pin that was moved afterwards (which used to save a location_name
  // that didn't match the stored latitude/longitude).
  const locationSeq = useRef(0);

  useEffect(() => {
    loadScan();
  }, [scanId]);

  useEffect(() => {
    if (locationEnabled && !pin) {
      useCurrentLocation();
    }
    // Toggling off doesn't clear the pin from state — just stops it from
    // being sent on Post. Toggling back on re-shows the same pin instead
    // of re-fetching GPS every time.
  }, [locationEnabled]);

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

    const { data, error } = await supabase
      .from("scans")
      .select("id, name, image_url, image_public_id")
      .eq("id", scanId)
      .maybeSingle();

    if (error || !data) {
      Alert.alert("Something went wrong", "Couldn't load this scan.");
      router.back();
      return;
    }

    setScan(data);
  }

  async function useCurrentLocation() {
    // Claim priority up front: if the user taps the map while GPS is still
    // resolving, their pin wins and this stale fix is dropped.
    const seq = ++locationSeq.current;
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Location permission needed",
          "Allow location access to auto-pin where you found this plant, or turn off Pin Location to post without one."
        );
        setLocationEnabled(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({});

      if (seq !== locationSeq.current) return; // superseded by a map tap

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setPin(coords);

      await resolveLocationName(coords);
    } catch (err) {
      console.error("[createpost] location failed:", err);
      Alert.alert("Couldn't get your location", "You can still tap the map to pin a spot manually.");
    } finally {
      setLocating(false);
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

  // PinMap hands us the tapped coordinate already unwrapped from the
  // native event — we only care about storing it and naming it.
  async function handlePinChange(coords: Coordinates) {
    setPinPicked(true); // a pin the user chose counts as unsaved work
    setPin(coords);

    await resolveLocationName(coords);
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
    // location_name must always match the latitude/longitude stored with it.
    if (locationEnabled && (locating || geocoding)) {
      Alert.alert("Getting your location", "Hang on a moment while we name this spot, then tap Post again.");
      return;
    }

    setPosting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
        latitude: locationEnabled && pin ? pin.latitude : null,
        longitude: locationEnabled && pin ? pin.longitude : null,
        location_name: locationEnabled ? locationName : null,
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

  // True while the pin's label is still being resolved (GPS or map tap).
  const locationBusy = locationEnabled && (locating || geocoding);

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
          <Text className="text-xl font-bold ml-4" style={{ color: "#1B4332" }}>
            Create Post
          </Text>
        </View>

        <View className="rounded-2xl p-4 mt-4" style={{ backgroundColor: "#FFFFFF" }}>
          {/* Scan preview */}
          <View className="flex-row items-center">
            <Image
              source={{ uri: scan.image_url }}
              style={{ width: 64, height: 64, borderRadius: 12 }}
            />
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

          {/* Location toggle */}
          <View className="flex-row items-center justify-between mt-4 mb-2">
            <Text className="font-semibold" style={{ color: "#1B4332" }}>
              Where did you find it?
            </Text>
            <Switch
              value={locationEnabled}
              onValueChange={(value) => {
                setPinToggleTouched(true); // the user's own choice — count it
                setLocationEnabled(value);
              }}
              trackColor={{ false: "#d1d5db", true: "#95D5B2" }}
              thumbColor={locationEnabled ? "#1B4332" : "#f4f3f4"}
            />
          </View>

          {locationEnabled ? (
            <>
              <Text className="text-xs mb-2" style={{ color: "#6b7280" }}>
                Tap to drop the pin · Double-tap to view the map full screen
              </Text>

              <PinMap
                coord={pin}
                onPinChange={handlePinChange}
                zoom={14}
                height={220}
                borderRadius={16}
                overlay={
                  locating ? (
                    <View
                      className="absolute inset-0 items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                    >
                      <ActivityIndicator color="#1B4332" />
                    </View>
                  ) : null
                }
              />

              {locationName && (
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
              )}
            </>
          ) : (
            <Text className="text-xs" style={{ color: "#6b7280" }}>
              This post won't include a location.
            </Text>
          )}

          {/* Post */}
          <Pressable
            onPress={handlePost}
            disabled={posting || locationBusy}
            className="rounded-full py-3 items-center mt-6"
            style={{ backgroundColor: "#1B4332", opacity: posting || locationBusy ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold">
              {posting ? "Posting..." : locationBusy ? "Finding location..." : "Post"}
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