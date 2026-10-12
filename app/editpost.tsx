import React, { useEffect, useState } from "react";
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
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import PinMap from "@/components/PinMap";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
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
  // The post's own location — display only. It was fixed when the photo
  // was taken (or read from its EXIF) and can't be edited here.
  const [coord, setCoord] = useState<Coord | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Full-screen viewer — tapping the post image opens it here.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Does the form still hold anything the database doesn't have yet?
  // The caption is the only editable field, so it alone counts — it is
  // trimmed and an empty caption is stored as null.
  const dirty = post != null && (caption.trim() || null) !== (post.caption ?? null);

  useEffect(() => {
    loadPost();
  }, [postId]);

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

    // Fixed location, shown read-only on the map below.
    if (p.latitude != null && p.longitude != null) {
      setCoord({ latitude: p.latitude, longitude: p.longitude });
    }

    setLoading(false);
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

    setSaving(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to save your changes.");
        return;
      }

      // Caption only — the photo and its location were fixed when the scan
      // was made, so nothing else is ever written. created_at is never
      // touched either, so the post keeps its original date and time.
      const { error } = await supabase
        .from("posts")
        .update({ caption: caption.trim() || null })
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

          {/* Caption — the only editable field on this screen */}
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

          {/* Location — the photo's own spot, fixed when it was taken.
              Read-only: the pin can't be dropped, moved or removed. */}
          <Text className="font-bold mt-4" style={{ color: "#000000" }}>
            Where did you find it?
          </Text>
          <Text className="text-xs" style={{ color: "#6b7280" }}>
            Double-tap to view the map full screen
          </Text>

          {coord ? (
            <>
              <PinMap coord={coord} zoom={15} height={170} borderRadius={20} style={{ marginTop: 8 }} />
              {post.location_name ? (
                <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
                  {post.location_name}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
              This post doesn't include a location.
            </Text>
          )}

          {/* Save */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-xl items-center justify-center mt-8"
            style={{ backgroundColor: "#137425", height: 44, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
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