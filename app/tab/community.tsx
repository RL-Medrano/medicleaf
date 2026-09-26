import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { getPlantDetailsBySlug } from "@/utils/plantClassifier";
import { GuestPrompt } from "@/components/GuestPrompt";

type Post = {
  id: string;
  name: string;
  plant_slug: string | null;
  caption: string | null;
  image_url: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  user_id: string;
  profiles: { username: string } | null;
};

type Conversation = {
  partnerId: string;
  partnerUsername: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Tab = "feed" | "messages";

const FEED_SEEN_KEY = "community_feed_last_seen";

// Change this path to your real pin icon. It's relative to this file:
// from app/tab/community.tsx, "../../assets/..." reaches the project root.
const ICONS = {
  pin: require("../../assets/icons/pin.png"),
};

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      className="rounded-full items-center justify-center ml-2"
      style={{
        minWidth: 22,
        height: 22,
        paddingHorizontal: 5,
        backgroundColor: "#34C759",
      }}
    >
      <Text className="text-white font-bold" style={{ fontSize: 11 }}>
        {count > 9 ? "9+" : count}
      </Text>
    </View>
  );
}

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newPosts, setNewPosts] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      checkGuestThenLoad();
    }, [activeTab])
  );

  async function checkGuestThenLoad() {
    // getAuthState() also recognises a local guest (no session at all),
    // which getUser() would have treated as "not a guest".
    const { user, isGuest: guest } = await getAuthState();
    setIsGuest(guest);
    setCurrentUserId(user?.id ?? null);

    if (guest) {
      // RLS blocks guests from reading posts/messages entirely — skip the
      // network call, there's nothing they're allowed to see anyway.
      setUnreadMessages(0);
      setNewPosts(0);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadBadgeCounts(user.id);

    if (activeTab === "feed") {
      loadPosts();
    } else {
      loadConversations();
    }
  }

  // Live badge updates via Supabase Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) return;

      channel = supabase
        .channel("community-badges")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          () => loadBadgeCounts(user.id)
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "posts" },
          () => loadBadgeCounts(user.id)
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeTab]);

  // Debounce search so we're not hitting Supabase on every keystroke
  useEffect(() => {
    if (activeTab !== "feed" || isGuest) return;
    const timeout = setTimeout(() => {
      loadPosts();
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  async function loadBadgeCounts(userId: string) {
    // Unread messages
    const { count: unread } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false)
      .eq("hidden_for_receiver", false);
    setUnreadMessages(unread ?? 0);

    // New posts from other people since the feed was last opened
    const now = new Date().toISOString();

    if (activeTab === "feed") {
      // Viewing the feed right now, so mark everything as seen
      await AsyncStorage.setItem(FEED_SEEN_KEY, now);
      setNewPosts(0);
      return;
    }

    const lastSeen = await AsyncStorage.getItem(FEED_SEEN_KEY);
    if (!lastSeen) {
      await AsyncStorage.setItem(FEED_SEEN_KEY, now);
      setNewPosts(0);
      return;
    }

    const { count: fresh } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gt("created_at", lastSeen)
      .neq("user_id", userId); // don't count your own posts
    setNewPosts(fresh ?? 0);
  }

  async function loadPosts() {
    setLoading(true);

    let query = supabase
      .from("posts")
      .select(
        "id, name, plant_slug, caption, image_url, location_name, latitude, longitude, created_at, user_id, profiles(username)"
      )
      .order("created_at", { ascending: false });

    if (searchQuery.trim()) {
      query = query.ilike("name", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setPosts(data as unknown as Post[]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  async function loadConversations() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Pull every message this user is part of, newest first. We build the
    // conversation list client-side rather than via a DB view — fine at
    // this scale, but worth moving to a Postgres function/view later if
    // message volume grows large.
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, content, is_read, created_at, hidden_for_sender, hidden_for_receiver"
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !messages) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const seen = new Map<
      string,
      { lastMessage: string; lastMessageAt: string; unreadCount: number }
    >();

    for (const msg of messages) {
      const isSender = msg.sender_id === user.id;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;

      // Skip messages the current user has hidden on their side
      if (isSender && msg.hidden_for_sender) continue;
      if (!isSender && msg.hidden_for_receiver) continue;

      if (!seen.has(partnerId)) {
        seen.set(partnerId, {
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: 0,
        });
      }

      if (!isSender && !msg.is_read) {
        seen.get(partnerId)!.unreadCount += 1;
      }
    }

    const partnerIds = Array.from(seen.keys());

    if (partnerIds.length === 0) {
      setConversations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", partnerIds);

    const usernameById = new Map(
      (profiles ?? []).map((p) => [p.id, p.username])
    );

    const list: Conversation[] = partnerIds.map((partnerId) => {
      const info = seen.get(partnerId)!;
      return {
        partnerId,
        partnerUsername: usernameById.get(partnerId) ?? "User",
        lastMessage: info.lastMessage,
        lastMessageAt: info.lastMessageAt,
        unreadCount: info.unreadCount,
      };
    });

    // Already roughly newest-first since `messages` was ordered that way,
    // but sort explicitly to be safe.
    list.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    setConversations(list);
    setLoading(false);
    setRefreshing(false);
  }

  function handleRefresh() {
    setRefreshing(true);
    if (activeTab === "feed") {
      loadPosts();
    } else {
      loadConversations();
    }
  }

  function handleLongPressConversation(item: Conversation) {
    Alert.alert(
      "Delete conversation?",
      `This removes your chat with ${item.partnerUsername} from your list. They will still see it on their side.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteConversation(item.partnerId),
        },
      ]
    );
  }

  async function deleteConversation(partnerId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Hide messages you sent AND messages you received in this chat.
    // Only your side is hidden — the other person keeps their copy.
    const [sent, received] = await Promise.all([
      supabase
        .from("messages")
        .update({ hidden_for_sender: true })
        .eq("sender_id", user.id)
        .eq("receiver_id", partnerId),
      supabase
        .from("messages")
        .update({ hidden_for_receiver: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", partnerId),
    ]);

    if (sent.error || received.error) {
      Alert.alert("Couldn't delete", "Please try again.");
      return;
    }

    setConversations((prev) => prev.filter((c) => c.partnerId !== partnerId));
    loadBadgeCounts(user.id); // refresh the Messages badge
  }

  function goToChat(partnerId: string, partnerUsername: string) {
    router.push({
      pathname: "/chat/[userid]",
      params: { userid: partnerId, username: partnerUsername },
    });
  }

  function handleLocationPress(post: Post) {
    // Opens the Map tab focused on this post's pin (map.tsx reads `postId`).
    // Change "/tab/map" if the route path differs from your folder structure.
    router.navigate({ pathname: "/tab/map", params: { postId: post.id } } as any);
  }

  function handleSendMessage(post: Post) {
    goToChat(post.user_id, post.profiles?.username ?? "User");
  }

  function formatDateTime(createdAt: string) {
    const date = new Date(createdAt);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { dateStr, timeStr };
  }

  function renderConversation({ item }: { item: Conversation }) {
    const time = new Date(item.lastMessageAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <Pressable
        onPress={() => goToChat(item.partnerId, item.partnerUsername)}
        onLongPress={() => handleLongPressConversation(item)}
        className="rounded-2xl p-4 mb-3 flex-row items-center"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 44, height: 44, backgroundColor: "#D8F3DC" }}
        >
          <Text style={{ color: "#1B4332" }}>👤</Text>
        </View>

        <View className="ml-3 flex-1">
          <Text className="font-bold" style={{ color: "#1B4332" }}>
            {item.partnerUsername}
          </Text>
          <Text
            className={item.unreadCount > 0 ? "font-bold" : ""}
            style={{ color: item.unreadCount > 0 ? "#1B4332" : "#6b7280" }}
            numberOfLines={1}
          >
            {item.unreadCount > 0
              ? `${item.unreadCount} new message${item.unreadCount > 1 ? "s" : ""}`
              : item.lastMessage}
          </Text>
        </View>

        <Text className="text-xs" style={{ color: "#6b7280" }}>
          {time}
        </Text>
      </Pressable>
    );
  }

  function renderPost({ item }: { item: Post }) {
    const { dateStr, timeStr } = formatDateTime(item.created_at);

    return (
      <View
        className="rounded-2xl p-4 mb-4"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <View className="flex-row items-center">
          <View
            className="rounded-full items-center justify-center"
            style={{ width: 40, height: 40, backgroundColor: "#D8F3DC" }}
          >
            <Text style={{ color: "#1B4332" }}>👤</Text>
          </View>
          <View className="ml-3">
            <Text className="font-bold" style={{ color: "#1B4332" }}>
              {item.profiles?.username ?? "Someone"}
            </Text>
            <Text className="text-xs" style={{ color: "#6b7280" }}>
              Date: {dateStr}
            </Text>
            <Text className="text-xs" style={{ color: "#6b7280" }}>
              Time: {timeStr}
            </Text>
            <Text className="text-xs" style={{ color: "#6b7280" }}>
              {item.name}
              {item.plant_slug &&
                getPlantDetailsBySlug(item.plant_slug)?.scientific_name &&
                `(${getPlantDetailsBySlug(item.plant_slug)!.scientific_name})`}
            </Text>
          </View>
        </View>

        <Text className="mt-3" style={{ color: "#1B4332" }}>
          {item.caption ?? `Found ${item.name}!`}
        </Text>

        <Image
          source={{ uri: item.image_url }}
          style={{ width: "100%", height: 220, borderRadius: 12, marginTop: 10 }}
          resizeMode="cover"
        />

        <View className="flex-row items-center justify-between mt-3">
          {/* Hidden on your own posts — messaging yourself would show every
              sent message twice, once as sent and once as "incoming". */}
          {item.user_id !== currentUserId ? (
            <Pressable
              onPress={() => handleSendMessage(item)}
              className="rounded-full py-2 px-4 flex-row items-center"
              style={{ backgroundColor: "#3B82F6" }}
            >
              <Text className="text-white font-semibold text-sm">
                ➤ Send Message
              </Text>
            </Pressable>
          ) : (
            <View />
          )}

          {item.location_name && (
            <Pressable
              onPress={() => handleLocationPress(item)}
              disabled={item.latitude == null || item.longitude == null}
              hitSlop={8}
              className="flex-row items-center"
            >
              <Image
                source={ICONS.pin}
                style={{ width: 16, height: 16, marginRight: 4 }}
                resizeMode="contain"
              />
              <Text className="text-xs" style={{ color: "#6b7280" }}>
                {item.location_name}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <Text
        className="text-xl font-bold text-center mt-4"
        style={{ color: "#1B4332" }}
      >
        Community
      </Text>

      {/* Tabs */}
      <View className="flex-row mt-4 px-5">
        <Pressable
          onPress={() => setActiveTab("feed")}
          className="flex-1 items-center py-3"
          style={{
            backgroundColor: activeTab === "feed" ? "#95D5B2" : "transparent",
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        >
          <View className="flex-row items-center">
            <Text
              className="font-semibold"
              style={{ color: activeTab === "feed" ? "#1B4332" : "#6b7280" }}
            >
              News Feed
            </Text>
            <TabBadge count={newPosts} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("messages")}
          className="flex-1 items-center py-3"
          style={{
            backgroundColor: activeTab === "messages" ? "#95D5B2" : "transparent",
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <View className="flex-row items-center">
            <Text
              className="font-semibold"
              style={{ color: activeTab === "messages" ? "#1B4332" : "#6b7280" }}
            >
              Messages
            </Text>
            <TabBadge count={unreadMessages} />
          </View>
        </Pressable>
      </View>

      {/* Search — only shown on News Feed, hidden for guests */}
      {activeTab === "feed" && !isGuest && (
        <View className="px-5 mt-4">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search medicinal plant"
            placeholderTextColor="#9ca3af"
            className="rounded-full px-4 py-3"
            style={{ backgroundColor: "#FFFFFF", color: "#1B4332" }}
          />
        </View>
      )}

      {/* List */}
      {isGuest ? (
        <GuestPrompt
          message={
            activeTab === "feed"
              ? "Create or Log in your account to see others posts"
              : "Create or Log in your account to see who messaged you"
          }
        />
      ) : loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1B4332" />
        </View>
      ) : activeTab === "feed" ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          className="px-5 mt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text style={{ color: "#6b7280" }}>
                {searchQuery ? "No posts match your search." : "No posts yet."}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.partnerId}
          renderItem={renderConversation}
          className="px-5 mt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Text style={{ color: "#6b7280" }}>No messages yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}