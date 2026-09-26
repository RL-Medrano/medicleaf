import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  Map as MapLibreMap,
  Camera,
  ViewAnnotation,
  RasterSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { getGeoapifyTileUrlTemplate } from "@/utils/geoapify";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { getPlantDetailsBySlug } from "@/utils/plantClassifier";

// Change these paths/filenames to match your assets folder
// (relative to this file, which lives in app/)
const ICONS = {
  back: require("../assets/icons/back.png"),
  pin: require("../assets/icons/pin.png"),
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

// Same blank style + Geoapify raster tiles setup used in map.tsx / createpost.tsx
const BLANK_MAP_STYLE = { version: 8 as const, sources: {}, layers: [] };

// Only used for the reverse-geocode lookup when saving a new pin. If your
// utils/geoapify (or createpost.tsx) already has a reverse-geocode helper,
// call that instead and delete this constant and the fetch below.
const GEOAPIFY_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? "";

// Used when the post has no saved pin yet. MapLibre uses [longitude, latitude].
const DEFAULT_VIEW = { center: [121.1631, 13.9411] as [number, number], zoom: 13 };

export default function EditPostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<EditablePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [caption, setCaption] = useState("");
  const [pinOn, setPinOn] = useState(false);
  const [coord, setCoord] = useState<Coord | null>(null);
  const [pinChanged, setPinChanged] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

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

    if (p.latitude != null && p.longitude != null) {
      setCoord({ latitude: p.latitude, longitude: p.longitude });
      setPinOn(true);
    }

    setLoading(false);
  }

  function handleMapPress(e: { nativeEvent: { lngLat: [number, number] } }) {
    if (!pinOn) return;
    const [longitude, latitude] = e.nativeEvent.lngLat;
    setCoord({ latitude, longitude });
    setPinChanged(true);
  }

  function handleTogglePin(value: boolean) {
    setPinOn(value);
    setPinChanged(true);
  }

  async function resolveLocationName(c: Coord, fallback: string | null) {
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${c.latitude}&lon=${c.longitude}&format=json&apiKey=${GEOAPIFY_KEY}`
      );
      const json = await res.json();
      const formatted: string | undefined = json?.results?.[0]?.formatted;
      if (formatted) return formatted;
    } catch {
      // fall through to the fallback below
    }
    return fallback ?? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`;
  }

  async function handleSave() {
    if (!post || saving) return;

    if (pinOn && !coord) {
      Alert.alert("Pin your location", "Tap on the map to drop a pin, or turn off Pin Location.");
      return;
    }

    setSaving(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to save your changes.");
        return;
      }

      // Only these columns are ever sent — created_at is never touched,
      // so the post keeps its original date and time.
      const updates: {
        caption: string | null;
        location_name?: string | null;
        latitude?: number | null;
        longitude?: number | null;
      } = {
        caption: caption.trim() || null,
      };

      if (pinChanged) {
        if (pinOn && coord) {
          updates.location_name = await resolveLocationName(coord, post.location_name);
          updates.latitude = coord.latitude;
          updates.longitude = coord.longitude;
        } else {
          updates.location_name = null;
          updates.latitude = null;
          updates.longitude = null;
        }
      }

      const { error } = await supabase.from("posts").update(updates).eq("id", post.id);
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

  const initialView = coord
    ? { center: [coord.longitude, coord.latitude] as [number, number], zoom: 15 }
    : DEFAULT_VIEW;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 56 }}>
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
          {/* Plant summary (not editable) */}
          <View className="flex-row items-center">
            <Image
              source={{ uri: post.image_url }}
              style={{ width: 110, height: 84 }}
              resizeMode="cover"
            />
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
            className="rounded-2xl px-3 py-3 mt-2"
            style={{
              height: 120,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              color: "#000000",
            }}
          />

          {/* Location */}
          <Text className="font-bold mt-4" style={{ color: "#000000" }}>
            Where did you find it?
          </Text>
          <Text className="text-xs" style={{ color: "#6b7280" }}>
            Tap on the map to pin location
          </Text>

          <View
            className="mt-2"
            style={{ height: 170, borderRadius: 20, overflow: "hidden", opacity: pinOn ? 1 : 0.5 }}
          >
            <MapLibreMap style={{ flex: 1 }} mapStyle={BLANK_MAP_STYLE} onPress={handleMapPress}>
              <Camera center={initialView.center} zoom={initialView.zoom} />

              <RasterSource
                id="geoapifySource"
                tiles={[getGeoapifyTileUrlTemplate()]}
                tileSize={256}
              >
                <Layer id="geoapifyLayer" type="raster" source="geoapifySource" />
              </RasterSource>

              {pinOn && coord && (
                <ViewAnnotation id="editPin" lngLat={[coord.longitude, coord.latitude]}>
                  <Image source={ICONS.pin} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </ViewAnnotation>
              )}
            </MapLibreMap>
          </View>

          <View className="flex-row items-center mt-3">
            <Switch
              value={pinOn}
              onValueChange={handleTogglePin}
              trackColor={{ false: "#D1D5DB", true: "#95D5B2" }}
              thumbColor={pinOn ? "#1B4332" : "#F3F4F6"}
            />
            <Text className="ml-2" style={{ color: "#6b7280" }}>
              Pin Location
            </Text>
          </View>

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
    </SafeAreaView>
  );
}