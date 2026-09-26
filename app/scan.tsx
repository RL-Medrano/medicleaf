import React, { useState } from "react";
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
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Please allow camera access to scan a plant."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
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
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  function handleContinue() {
    if (!imageUri) return;

    // Pass the local file URI to the Scanning screen — the actual
    // tflite inference happens there, not here.
    router.push({
      pathname: "/scanning",
      params: { imageUri },
    });
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
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

        {/* Take a photo */}
        <Pressable
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
            className="rounded-full py-3 items-center mt-6"
            style={{ backgroundColor: "#1B4332" }}
          >
            <Text className="text-white font-bold">Scan Plant</Text>
          </Pressable>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}