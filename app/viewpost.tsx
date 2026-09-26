import React, { useCallback, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StatusBar, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { checkIsOnline } from "@/utils/network";
import { getPlantDetailsBySlug } from "@/utils/plantClassifier";

// Icon images — matches the @/assets/images/icons/... convention used
// elsewhere in the app (search.tsx, profile.tsx, scan.tsx, map.tsx,
// allpost.tsx). "user" was removed — see PostDetail.profiles.avatar_url
// below, which is the real per-user photo, not a static icon.
const ICONS = {
  back: require("@/assets/images/icons/arrow_left.png"),
  trash: require("@/assets/images/icons/trash icon.png"),
  pin: require("@/assets/images/icons/pin.png"),
};

type PostDetail = {
  id: string;
  name: string;
  plant_slug: string | null;
  caption: string | null;
  image_url: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function ViewPostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Reloads every time the screen regains focus, so changes made on the
  // Edit Post screen show up as soon as you come back here.
  useFocusEffect(
    useCallback(() => {
      loadPost();
    }, [postId])
  );

  async function loadPost() {
    if (!postId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, name, plant_slug, caption, image_url, location_name, latitude, longitude, created_at, profiles(username, avatar_url)"
      )
      .eq("id", postId)
      .maybeSingle();

    if (error || !data) {
      Alert.alert("Something went wrong", "Couldn't load this post.");
      router.back();
      return;
    }

    setPost(data as unknown as PostDetail);
    setLoading(false);
  }

  function handleEditPress() {
    if (!post) return;
    // Change "/editpost" to the real path of your Edit Post screen.
    // The `as any` can be removed once that file exists and typed routes pick it up.
    router.push({ pathname: "/editpost", params: { postId: post.id } } as any);
  }

  function handlePinPress() {
    if (!post) return;
    // Opens the Map tab focused on this post's pin. map.tsx reads `postId`,
    // centers on the pin and opens its bottom card.
    // Change "/tab/map" if the route path differs from your folder structure.
    router.navigate({ pathname: "/tab/map", params: { postId: post.id } } as any);
  }

  function handleDeletePress() {
    Alert.alert(
      "Delete this post?",
      "This will permanently remove it from the community feed.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete },
      ]
    );
  }

  async function confirmDelete() {
    if (!post || deleting) return;

    setDeleting(true);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to delete this post.");
        return;
      }

      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;

      router.back();
    } catch (err) {
      console.error("[viewpost] delete failed:", err);
      Alert.alert("Something went wrong", "Couldn't delete this post. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(createdAt: string) {
    return new Date(createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(createdAt: string) {
    return new Date(createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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

      {/* Header: back arrow, plant name, Edit */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 56 }}>
          <Image source={ICONS.back} style={{ width: 26, height: 26 }} resizeMode="contain" />
        </Pressable>

        <Text
          className="flex-1 text-xl font-bold text-center"
          style={{ color: "#000000" }}
          numberOfLines={1}
        >
          {post.name}
        </Text>

        <Pressable onPress={handleEditPress} hitSlop={12} style={{ width: 56, alignItems: "flex-end" }}>
          <Text className="font-bold" style={{ color: "#2D6A4F", fontSize: 16 }}>
            Edit
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB" }}
        >
          {/* Author row — this screen is only reached from your own
              "All Posts" list (allpost.tsx, under Profile), so the
              author is always you. Show your real avatar (same source
              as profile.tsx: profiles.avatar_url, falling back to
              place_holder.png) instead of a static user icon. */}
          <View className="flex-row items-start">
            <View style={{ width: 52, alignItems: "center", justifyContent: "center" }}>
              <Image
                source={
                  post.profiles?.avatar_url
                    ? { uri: post.profiles.avatar_url }
                    : require("@/assets/images/icons/place_holder.png")
                }
                style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#D1D5DB" }}
                resizeMode="cover"
              />
            </View>

            <View className="ml-3 flex-1">
              <Text className="font-bold" style={{ color: "#000000", fontSize: 17 }}>
                {post.profiles?.username ?? "You"}
              </Text>
              <Text style={{ color: "#000000", fontSize: 11 }}>
                Date: {formatDate(post.created_at)}
              </Text>
              <Text style={{ color: "#000000", fontSize: 11 }}>
                Time: {formatTime(post.created_at)}
              </Text>
              <Text style={{ color: "#000000", fontSize: 11 }}>
                {post.name}
                {scientificName ? `(${scientificName})` : ""}
              </Text>
            </View>

            <Pressable onPress={handleDeletePress} disabled={deleting} hitSlop={10}>
              <Image
                source={ICONS.trash}
                style={{ width: 26, height: 26, opacity: deleting ? 0.4 : 1 }}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          {/* Caption */}
          <Text className="mt-3" style={{ color: "#000000", fontSize: 15 }}>
            {post.caption ?? `Found ${post.name}!`}
          </Text>

          {/* Photo */}
          <Image
            source={{ uri: post.image_url }}
            style={{ width: "100%", height: 260, marginTop: 10 }}
            resizeMode="cover"
          />

          {/* Location pin */}
          <View className="flex-row justify-end" style={{ marginTop: 16, minHeight: 28 }}>
            {post.latitude != null && post.longitude != null && (
              <Pressable onPress={handlePinPress} hitSlop={10}>
                <Image source={ICONS.pin} style={{ width: 24, height: 24 }} resizeMode="contain" />
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}