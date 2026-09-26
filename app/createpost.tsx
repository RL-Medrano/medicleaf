/**
 * app/createpost.tsx
 *
 * Uses MapLibre React Native v11.x (confirmed installed: 11.3.10).
 * v11 renamed/restructured several components vs v10 — this file uses the
 * CORRECT v11 names, confirmed against the official migration guide:
 *   PointAnnotation -> ViewAnnotation (coordinate prop -> lngLat)
 *   RasterLayer     -> Layer (with type="raster", source prop not sourceID)
 *   Camera props: centerCoordinate -> center, zoomLevel -> zoom
 *   Map requires a `mapStyle` prop (base style) — we pass a blank style
 *   object since Geoapify tiles are added as a child RasterSource/Layer,
 *   not baked into the base style itself.
 *   Events use event.nativeEvent, not the raw event object.
 *
 * No API key needed — MapLibre is fully open-source, Geoapify tiles are
 * supplied via RasterSource using the URL template from utils/geoapify.ts.
 */
import React, { useEffect, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Map, Camera, ViewAnnotation, RasterSource, Layer } from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { supabase } from "@/utils/supabase";
import { reverseGeocode, getGeoapifyTileUrlTemplate } from "@/utils/geoapify";

// Blank base style — we don't want any base map, only our own Geoapify
// raster layer added as a child below. An empty sources/layers style is
// MapLibre's documented way to start from nothing.
const BLANK_MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [],
};

type ScanForPost = {
  id: string;
  name: string;
  image_url: string;
  image_public_id: string;
};

type Coordinates = { latitude: number; longitude: number };

// Fallback center (used only until GPS/pin is set) — Lipa City, Batangas
const DEFAULT_REGION = {
  latitude: 13.9411,
  longitude: 121.1631,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function CreatePostScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();

  const [scan, setScan] = useState<ScanForPost | null>(null);
  const [caption, setCaption] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [pin, setPin] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [posting, setPosting] = useState(false);

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
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setPin(coords);

      const geocoded = await reverseGeocode(coords.latitude, coords.longitude);
      setLocationName(geocoded.formatted);
    } catch (err) {
      console.error("[createpost] location failed:", err);
      Alert.alert("Couldn't get your location", "You can still tap the map to pin a spot manually.");
    } finally {
      setLocating(false);
    }
  }

  async function handleMapPress(event: any) {
    if (!locationEnabled) return;

    // v11 events follow the NativeSyntheticEvent pattern — payload lives
    // in event.nativeEvent, and coordinates are [longitude, latitude].
    const [longitude, latitude] = event.nativeEvent.lngLat;
    const coords = { latitude, longitude };
    setPin(coords);
    setLocationName(null); // clear stale label while re-geocoding

    try {
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude);
      setLocationName(geocoded.formatted);
    } catch (err) {
      console.error("[createpost] reverse geocode failed:", err);
      setLocationName("Unknown location");
    }
  }

  async function handlePost() {
    if (!scan || posting) return;

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

  const mapRegion = pin
    ? { ...pin, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

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
              onValueChange={setLocationEnabled}
              trackColor={{ false: "#d1d5db", true: "#95D5B2" }}
              thumbColor={locationEnabled ? "#1B4332" : "#f4f3f4"}
            />
          </View>

          {locationEnabled ? (
            <>
              <Text className="text-xs mb-2" style={{ color: "#6b7280" }}>
                Tap on the map to adjust the pin location
              </Text>

              <View
                style={{ height: 220, borderRadius: 16, overflow: "hidden" }}
              >
                <Map style={{ flex: 1 }} mapStyle={BLANK_MAP_STYLE} onPress={handleMapPress}>
                  <Camera
                    center={[mapRegion.longitude, mapRegion.latitude]}
                    zoom={14}
                  />

                  <RasterSource
                    id="geoapifySource"
                    tiles={[getGeoapifyTileUrlTemplate()]}
                    tileSize={256}
                  >
                    <Layer id="geoapifyLayer" type="raster" source="geoapifySource" />
                  </RasterSource>

                  {pin && (
                    <ViewAnnotation
                      id="selectedPin"
                      lngLat={[pin.longitude, pin.latitude]}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: "#1B4332",
                          borderWidth: 2,
                          borderColor: "#FFFFFF",
                        }}
                      />
                    </ViewAnnotation>
                  )}
                </Map>

                {locating && (
                  <View
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                  >
                    <ActivityIndicator color="#1B4332" />
                  </View>
                )}
              </View>

              {locationName && (
                <Text className="text-xs mt-2" style={{ color: "#374151" }}>
                  📍 {locationName}
                </Text>
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
            disabled={posting}
            className="rounded-full py-3 items-center mt-6"
            style={{ backgroundColor: "#1B4332", opacity: posting ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold">
              {posting ? "Posting..." : "Post"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}