import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
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
import PinMap, { LUZON_CENTER, LUZON_ZOOM } from "@/components/PinMap";
import { getLastKnownCenter } from "@/utils/photoLocation";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { reverseGeocode } from "@/utils/geoapify";
import { getPlantDetailsBySlug } from "@/utils/plantClassifier";

// Icons live in assets/images/icons/
// (relative to this file, which lives in app/)
const ICONS = {
  back: require("../assets/images/icons/back.png"),
};

type EditablePost = {
  id: string;
  name: string;
  plant_slug: string | null;
  caption: string | null;
  image_url: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Coord = { latitude: number; longitude: number };

export default function EditPostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<EditablePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [caption, setCaption] = useState("");
  // The post's pin — starts at the photo's own spot (or wherever it was
  // last saved); a tap on the map moves it (or drops the first one when
  // this post never had a location), and Save writes it back with its
  // freshly resolved label.
  const [coord, setCoord] = useState<Coord | null>(null);
  // The phone's last known position — camera-only starting view for the
  // empty map (never saved as the post's location). Null → the Luzon view.
  const [userCenter, setUserCenter] = useState<Coord | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  // Pin Location switch — starts ON, same as Create Post: the user
  // decides whether this edit keeps a location. Off means the save
  // clears it (even a stored one), hides the pin, ignores map taps, and
  // blocks the full-screen view.
  const [pinEnabled, setPinEnabled] = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Full-screen viewer — tapping the post image opens it here.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Monotonic id for "the location the label belongs to" — same guard as
  // Create Post: a slow geocode for an older pin must never overwrite the
  // name next to the current one (or be saved with mismatched coords).
  const locationSeq = useRef(0);

  // Does the form still hold anything the database doesn't have yet? The
  // caption (trimmed; an empty caption is stored as null) and the pin's
  // position — both, since either one can change before saving.
  const captionChanged = post != null && (caption.trim() || null) !== (post.caption ?? null);
  // What the save would actually store: the pin gated by the Pin Location
  // switch (off = the location is being removed). Dirty compares against
  // that effective value, so a switch flip that nets out to what's already
  // saved isn't an unsaved change.
  const savedCoord = pinEnabled ? coord : null;
  const locationChanged =
    post != null &&
    (((savedCoord?.latitude ?? null) !== (post.latitude ?? null)) ||
      ((savedCoord?.longitude ?? null) !== (post.longitude ?? null)));
  const dirty = captionChanged || locationChanged;

  useEffect(() => {
    loadPost();
  }, [postId]);

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

  // The hardware back button must ask before discarding edits, exactly like
  // the header back button. Confirmation Modals intercept back themselves
  // while open, so this listener only ever runs over the form.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (saving) return true; // a save is in flight — let it finish
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
  }, [dirty, confirmLeave, saving]);

  async function loadPost() {
    if (!postId) return;

    const { data, error } = await supabase
      .from("posts")
      .select("id, name, plant_slug, caption, image_url, location_name, latitude, longitude")
      .eq("id", postId)
      .maybeSingle();

    if (error || !data) {
      Alert.alert("Something went wrong", "Couldn't load this post.");
      router.back();
      return;
    }

    const p = data as unknown as EditablePost;
    setPost(p);
    setCaption(p.caption ?? "");

    // Starting pin: the photo's own spot, under the map below (or none —
    // the map then offers to place the first one).
    if (p.latitude != null && p.longitude != null) {
      setCoord({ latitude: p.latitude, longitude: p.longitude });
    }
    setLocationName(p.location_name);

    setLoading(false);
  }

  /**
   * Reverse-geocodes `coords` into locationName, keyed on locationSeq so
   * only the most recent request may write state — the same guard as
   * Create Post, so a slow response for an old pin can never leave a
   * stale name next to the current one.
   */
  async function resolveLocationName(coords: Coord) {
    const seq = ++locationSeq.current;
    setGeocoding(true);
    setLocationName(null);

    try {
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude);
      if (seq !== locationSeq.current) return; // a newer pin is being labelled
      setLocationName(geocoded.formatted);
    } catch (err) {
      if (seq !== locationSeq.current) return;
      console.error("[editpost] reverse geocode failed:", err);
      setLocationName("Unknown location");
    } finally {
      if (seq === locationSeq.current) setGeocoding(false);
    }
  }

  // Single tap on the map (inline or full screen) moves the pin to the
  // tapped point and re-resolves its address label — or drops the first
  // pin when this post never had a location.
  function handlePinChange(coords: Coord) {
    setCoord(coords);
    resolveLocationName(coords);
  }

  // Leaving is only allowed straight away when nothing is pending —
  // otherwise the confirmation popup gets the final say.
  function handleBack() {
    if (saving) return; // a save is in flight — let it finish
    if (dirty) setConfirmLeave(true);
    else router.back();
  }

  async function handleSave() {
    if (!post || saving) return;

    // Never save a pin while its label is still being resolved — the
    // location_name must always match the latitude/longitude stored with
    // it (same guard as Create Post). Pin Location off saves nothing
    // location-related, so there's nothing to wait for.
    if (pinEnabled && coord && geocoding) {
      Alert.alert(
        "Naming this spot",
        "Hang on a moment while we name this location, then tap Save again."
      );
      return;
    }

    setSaving(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to save your changes.");
        return;
      }

      // Caption and location — the photo itself is never touched, and
      // created_at is never written either, so the post keeps its
      // original date and time. Coord and label travel together, guarded
      // above so they can never disagree — and all three clear together
      // when Pin Location is switched off.
      const { error } = await supabase
        .from("posts")
        .update({
          caption: caption.trim() || null,
          latitude: pinEnabled && coord ? coord.latitude : null,
          longitude: pinEnabled && coord ? coord.longitude : null,
          location_name: pinEnabled && coord ? locationName : null,
        })
        .eq("id", post.id);
      if (error) throw error;

      router.back();
    } catch (err) {
      console.error("[editpost] save failed:", err);
      Alert.alert("Something went wrong", "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !post) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: "#D8F3DC" }}>
        <ActivityIndicator color="#1B4332" />
      </SafeAreaView>
    );
  }

  const scientificName = post.plant_slug
    ? getPlantDetailsBySlug(post.plant_slug)?.scientific_name
    : null;
  // The pin's label is still being fetched — Save waits for it so the
  // stored location_name can never disagree with the stored coordinates
  // (only while Pin Location is on; off saves no location at all).
  const naming = pinEnabled && coord != null && geocoding;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={handleBack} hitSlop={12} style={{ width: 56 }}>
          <Image source={ICONS.back} style={{ width: 26, height: 26 }} resizeMode="contain" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-center" style={{ color: "#000000" }}>
          Edit Post
        </Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB" }}
        >
          {/* Plant summary (not editable) — tap the image to view full-screen */}
          <View className="flex-row items-center">
            <Pressable onPress={() => setViewerUri(post.image_url)}>
              <Image
                source={{ uri: post.image_url }}
                style={{ width: 110, height: 84 }}
                resizeMode="cover"
              />
            </Pressable>
            <View className="ml-4 flex-1">
              <Text className="font-bold" style={{ color: "#000000", fontSize: 16 }}>
                {post.name}
              </Text>
              {scientificName ? (
                <Text className="font-bold" style={{ color: "#000000", fontSize: 16 }}>
                  {scientificName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Caption */}
          <Text className="font-bold mt-4" style={{ color: "#000000" }}>
            Say something
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            multiline
            textAlignVertical="top"
            maxLength={500}
            placeholder="Share something about this find..."
            placeholderTextColor="#9ca3af"
            className="rounded-2xl px-3 py-3 mt-2"
            style={{
              height: 120,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              color: "#000000",
            }}
          />

          {/* Location — starts at the photo's own spot; a tap anywhere on
              the map moves the pin there (or adds the first one when this
              post never had a location). Pin Location off = the map stays
              on screen, but taps and the full-screen view are blocked. */}
          <Text className="font-bold mt-4" style={{ color: "#000000" }}>
            Where did you find it?
          </Text>
          <Text className="text-xs" style={{ color: "#6b7280" }}>
            {pinEnabled
              ? coord
                ? "Tap the map to move the pin — double-tap to view it full screen"
                : "Tap the map to place the pin — double-tap to view it full screen"
              : "Pin Location is off — this post won't include a location."}
          </Text>

          <PinMap
            coord={coord}
            fallbackCenter={userCenter ?? LUZON_CENTER}
            onPinChange={pinEnabled ? handlePinChange : undefined}
            zoom={coord || userCenter ? 15 : LUZON_ZOOM}
            height={170}
            borderRadius={20}
            style={{ marginTop: 8 }}
            showPin={pinEnabled}
            disabled={!pinEnabled}
            allowFullView={pinEnabled}
          />
          {/* Pin Location switch — always starts on; the user decides
              whether the edit keeps a location. */}
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
            locationName ? (
              <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
                {locationName}
              </Text>
            ) : geocoding ? (
              <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
                Naming this spot...
              </Text>
            ) : coord ? null : (
              <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
                This post doesn't include a location — tap the map to add one.
              </Text>
            )
          ) : null}

          {/* Save */}
          <Pressable
            onPress={handleSave}
            disabled={saving || naming}
            className="rounded-xl items-center justify-center mt-8"
            style={{ backgroundColor: "#137425", height: 44, opacity: saving || naming ? 0.6 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : naming ? (
              <Text className="text-white" style={{ fontSize: 16 }}>
                Naming this spot...
              </Text>
            ) : (
              <Text className="text-white" style={{ fontSize: 16 }}>
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Unsaved-changes confirmation — shown instead of leaving straight
          away when the header back button (or the hardware back button)
          is pressed with edits still pending. */}
      <Modal
        visible={confirmLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLeave(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>You haven't saved your post yet</Text>
            <Text style={styles.dialogBody}>
              If you go back now, the changes you made will be lost.
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

      {/* Image viewer — tap the image to see it full-screen; tap anywhere
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