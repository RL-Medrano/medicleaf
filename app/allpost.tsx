import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { checkIsOnline } from "@/utils/network";

type MyPost = {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
};

export default function AllPostsScreen() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  async function loadPosts() {
    setLoading(true);
    setLoadFailed(false);

    // getAuthState() reads the stored session, so a signed-in member is
    // still recognised offline (getUser() asks the server and would fail).
    const { user, isGuest } = await getAuthState();

    // Defense-in-depth: this screen is only reachable via Profile's
    // menu, which already hides it entirely for guests — but bail out
    // cleanly if someone deep-links here directly anyway.
    if (!user || isGuest) {
      router.back();
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("id, name, image_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Don't show "no posts yet" when the real problem is the load failed
      // (for example, no connection).
      console.error("[allposts] load failed:", error.message);
      setLoadFailed(true);
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
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

  function handleDeletePress(post: MyPost) {
    Alert.alert(
      "Delete this post?",
      "This will permanently remove it from the community feed.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(post.id) },
      ]
    );
  }

  async function confirmDelete(postId: string) {
    if (deletingId) return;

    setDeletingId(postId);
    try {
      const online = await checkIsOnline();
      if (!online) {
        Alert.alert("You're offline", "Connect to the internet to delete this post.");
        return;
      }

      // Only removes the posts row — does NOT touch the original scan,
      // which stays fully intact in History either way (same
      // independence the app already relies on elsewhere).
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      // NOTE: does not delete the image from Cloudinary — same parked
      // limitation as scan deletion, pending the Cloudinary delete
      // Edge Function.

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("[allposts] delete failed:", err);
      Alert.alert("Something went wrong", "Couldn't delete this post. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <Text
          className="flex-1 text-xl font-bold text-center"
          style={{ color: "#1B4332", marginRight: 24 }}
        >
          All Posts
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1B4332" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text className="text-center mt-10" style={{ color: "#40916C" }}>
              {loadFailed
                ? "Couldn't load your posts. Connect to the internet and try again."
                : "You haven't posted anything yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/viewpost", params: { postId: item.id } })}
              className="rounded-2xl p-3 flex-row items-center mb-3"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Image
                source={{ uri: item.image_url }}
                style={{ width: 64, height: 64, borderRadius: 12 }}
              />
              <View className="flex-1 ml-3">
                <Text className="font-bold" style={{ color: "#1B4332" }}>
                  {item.name}
                </Text>
                <Text className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  Date: {formatDate(item.created_at)}
                </Text>
                <Text className="text-xs" style={{ color: "#6b7280" }}>
                  Time: {formatTime(item.created_at)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeletePress(item)}
                disabled={deletingId === item.id}
                hitSlop={10}
                style={{ opacity: deletingId === item.id ? 0.4 : 1 }}
              >
                <Image
                  source={require("@/assets/images/icons/trash icon.png")}
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}