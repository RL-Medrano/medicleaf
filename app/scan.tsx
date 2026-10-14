import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import ScanWalkthrough from "@/components/ScanWalkthrough";
import {
  type PhotoCoords,
  readExifCoord,
  coordsToParams,
  getCaptureLocation,
} from "@/utils/photoLocation";

type ImageSource = "camera" | "library";

/**
 * The photo's location, read the moment it's picked:
 *   • camera  → EXIF GPS if the camera app wrote it, otherwise a live fix
 *     taken right after the shutter fired (so the pin marks where the
 *     plant actually was, even if the user posts days later)
 *   • gallery → EXIF GPS only — an old photo's location can't be invented
 */
export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
  const [photoCoords, setPhotoCoords] = useState<PhotoCoords | null>(null);
  // True when the camera photo carries no location purely because the user
  // refused location permission — Scan Result uses this to ask once more
  // when they go to post (rather than silently posting without a pin).
  const [locationDenied, setLocationDenied] = useState(false);
  const [locating, setLocating] = useState(false);

  /* First-run walkthrough (mockups Scan(tutorial1..4).png) */
  // Home's Tutorial Guide pushes /scan?walkthrough=<token> on every Go
  // press — a fresh timestamp, so this effect re-fires per press.
  const { walkthrough } = useLocalSearchParams<{ walkthrough?: string }>();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // Live scroll bookkeeping for the walkthrough's auto-scroll.
  const scrollYRef = useRef(0);
  const contentHRef = useRef(0);
  const viewportHRef = useRef(0);
  // The four elements each walkthrough step highlights.
  const previewRef = useRef<View>(null);
  const takePhotoRef = useRef<View>(null);
  const uploadPhotoRef = useRef<View>(null);
  const tipsRef = useRef<View>(null);

  useEffect(() => {
    // Any walkthrough token from the Guide runs the overlay — Go now
    // replays the tutorial on demand (the old shouldShowWalkthrough
    // gate blocked re-runs for completed steps).
    if (walkthrough) setShowWalkthrough(true);
  }, [walkthrough]);

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Please allow camera access to scan a plant."
      );
      return;
    }

    // Asked before opening the camera so the fix below is ready the moment
    // the photo is. Declining is fine — the scan still works, the photo
    // just won't carry a location.
    const locationPermission = await Location.requestForegroundPermissionsAsync();

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      exif: true,
    });

    const asset = result.canceled ? null : (result.assets?.[0] ?? null);
    if (!asset?.uri) return;

    setImageUri(asset.uri);
    setImageSource("camera");
    setLocationDenied(false);

    // Free first: some camera apps write GPS straight into the EXIF.
    const exifCoords = readExifCoord(asset.exif);
    if (exifCoords) {
      setPhotoCoords(exifCoords);
      return;
    }

    if (!locationPermission.granted) {
      setPhotoCoords(null);
      setLocationDenied(true);
      return;
    }

    // Right after the shutter, so this is the capture-time location.
    setLocating(true);
    setPhotoCoords(await getCaptureLocation());
    setLocating(false);
  }

  async function handleUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo library permission needed",
        "Please allow photo library access to upload a plant photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      exif: true,
    });

    const asset = result.canceled ? null : (result.assets?.[0] ?? null);
    if (!asset?.uri) return;

    setImageUri(asset.uri);
    setImageSource("library");
    setLocationDenied(false);
    // The device's current position is deliberately NOT used here — an old
    // photo's location can only come from its own EXIF. With no EXIF GPS,
    // Scan Result blocks posting and offers Save / Go to Library instead.
    setPhotoCoords(readExifCoord(asset.exif));
  }

  function handleContinue() {
    if (!imageUri || locating) return;

    // Pass the local file URI to the Scanning screen — the actual
    // tflite inference happens there, not here. The photo's location
    // rides along as strings (router params are always strings).
    router.push({
      pathname: "/scanning",
      params: {
        imageUri,
        imageSource: imageSource ?? "",
        // "1" when the photo has no location purely because the user
        // refused permission — Scan Result asks them once more on Post.
        locationDenied: locationDenied ? "1" : "",
        ...coordsToParams(photoCoords),
      },
    });
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          onLayout={(e) => {
            viewportHRef.current = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, h) => {
            contentHRef.current = h;
          }}
        >
          {/* Header */}
          <View className="flex-row items-center mt-4">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Image
                source={require("@/assets/images/icons/arrow_left.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <Text
            className="text-2xl font-bold text-center mt-2"
            style={{ color: "#1B4332" }}
          >
            Scan Medicinal Plant
          </Text>
          <Text
            className="text-sm text-center mt-2 px-4"
            style={{ color: "#374151" }}
          >
            Capture or upload a photo to identify the medicinal plant.
          </Text>

          {/* Preview box */}
          <View
            ref={previewRef}
            className="rounded-2xl mt-6 items-center justify-center overflow-hidden"
            style={{
              backgroundColor: "#FFFFFF",
              height: 320,
              borderWidth: imageUri ? 0 : 1,
              borderColor: "#B7E4C7",
              borderStyle: "dashed",
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-sm" style={{ color: "#9ca3af" }}>
                No photo selected yet
              </Text>
            )}
          </View>

          {/* Where this photo's location came from */}
          {imageUri && (
            <Text className="text-xs text-center mt-2" style={{ color: "#6b7280" }}>
              {locating
                ? "Getting the location where this photo was taken..."
                : photoCoords
                  ? "Location captured for this photo"
                  : imageSource === "library"
                    ? "This photo doesn't include a location"
                    : locationDenied
                      ? "Location access is off — allow it to add this photo's location"
                      : "No location available for this photo"}
            </Text>
          )}

          {/* Take a photo */}
          <Pressable
            ref={takePhotoRef}
            onPress={handleTakePhoto}
            className="rounded-2xl p-4 mt-5 flex-row items-center"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Image
              source={require("@/assets/images/icons/camera.png")}
              style={{ width: 24, height: 24, marginRight: 12 }}
              resizeMode="contain"
            />
            <View>
              <Text className="font-bold" style={{ color: "#1B4332" }}>
                Take a photo
              </Text>
              <Text className="text-xs" style={{ color: "#6b7280" }}>
                use your camera to scan a plant
              </Text>
            </View>
          </Pressable>

          {/* Upload photo */}
          <Pressable
            ref={uploadPhotoRef}
            onPress={handleUploadPhoto}
            className="rounded-2xl p-4 mt-3 flex-row items-center"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <Image
              source={require("@/assets/images/icons/image(2).png")}
              style={{ width: 24, height: 24, marginRight: 12 }}
              resizeMode="contain"
            />
            <View>
              <Text className="font-bold" style={{ color: "#1B4332" }}>
                Upload photo
              </Text>
              <Text className="text-xs" style={{ color: "#6b7280" }}>
                Choose from your gallery
              </Text>
            </View>
          </Pressable>

          {/* Tips */}
          <View
            ref={tipsRef}
            className="rounded-2xl p-4 mt-5"
            style={{ backgroundColor: "#40694A" }}
          >
            <View className="flex-row items-center mb-1">
              <Image
                source={require("@/assets/images/icons/Info.png")}
                style={{ width: 16, height: 16, marginRight: 6 }}
                resizeMode="contain"
              />
              <Text className="font-bold text-white">
                Tips for better results
              </Text>
            </View>
            <Text className="text-white text-sm">• Use natural lighting</Text>
            <Text className="text-white text-sm">• Keep the plant focus</Text>
            <Text className="text-white text-sm">
              • Include unique features (leaf shape, color, and texture)
            </Text>
          </View>

          {/* Continue */}
          {imageUri && (
            <Pressable
              onPress={handleContinue}
              disabled={locating}
              className="rounded-full py-3 items-center mt-6"
              style={{ backgroundColor: "#1B4332", opacity: locating ? 0.6 : 1 }}
            >
              <Text className="text-white font-bold">
                {locating ? "Getting location..." : "Scan Plant"}
              </Text>
            </Pressable>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>

      {/* First-run coach-mark walkthrough — only accounts whose guide is
          still unfinished ever see it (see utils/tutorial.ts). */}
      {showWalkthrough && (
        <ScanWalkthrough
          targets={{
            preview: previewRef,
            takePhoto: takePhotoRef,
            uploadPhoto: uploadPhotoRef,
            tips: tipsRef,
          }}
          scrollYRef={scrollYRef}
          contentHRef={contentHRef}
          viewportHRef={viewportHRef}
          scrollTo={(y) => scrollRef.current?.scrollTo({ y, animated: false })}
          onFinish={() => setShowWalkthrough(false)}
        />
      )}
    </View>
  );
}