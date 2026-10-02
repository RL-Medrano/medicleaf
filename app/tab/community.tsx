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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { markTutorialStep } from "@/utils/tutorial";
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
  profiles: { username: string; avatar_url: string | null } | null;
};

type Conversation = {
  partnerId: string;
  partnerUsername: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Tab = "feed" | "messages";

const FEED_SEEN_KEY = "community_feed_last_seen";

// Pin icon lives in assets/images/icons/.
// It's relative to this file: from app/tab/community.tsx,
// "../../assets/..." reaches the project root.
const ICONS = {
  pin: require("../../assets/images/icons/pin.png"),
  search: require("../../assets/images/icons/search.png"),
  placeholder: require("../../assets/images/icons/place_holder.png"),
  send: require("../../assets/images/icons/send icon.png"),
};

// Avatar shown when the user has no profile picture (mockup: place_holder.png).
function Avatar({
  uri,
  size,
}: {
  uri: string | null | undefined;
  size: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: "#E9E9E9",
      }}
    >
      <Image
        source={uri ? { uri } : ICONS.placeholder}
        style={{ width: size, height: size }}
        resizeMode={uri ? "cover" : "contain"}
      />
    </View>
  );
}

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
  // The tutorial's "Message" step lands here with ?tab=messages so the Go
  // button opens the right tab directly instead of the News Feed.
  const { tab: requestedTab } = useLocalSearchParams<{ tab?: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newPosts, setNewPosts] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Deep link with ?tab=messages (used by the tutorial's "Message" Go
  // button) opens the Messages tab directly instead of the News Feed.
  useEffect(() => {
    if (requestedTab === "messages") setActiveTab("messages");
  }, [requestedTab]);

  useFocusEffect(
    useCallback(() => {
      checkGuestThenLoad();

      // Tutorial progress: the News Feed completes "View Posts", the
      // Messages tab completes "Message". No-op for guests and accounts
      // the guide isn't enrolled in.
      markTutorialStep(activeTab === "feed" ? "viewposts" : "message");
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
    // Set by cleanup before the async setup below has resolved — without it
    // we'd subscribe after unmount and never remove that channel.
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user || user.is_anonymous) return;

      // Fresh topic per subscription: supabase.channel(name) hands back the
      // channel still registered under that topic, and attaching
      // postgres_changes callbacks to one that is joining/joined throws
      // "cannot add ... callbacks after subscribe()". removeChannel() only
      // completes asynchronously, so a quick tab switch can outrun it.
      channel = supabase
        .channel(`community-badges-${Math.random().toString(36).slice(2, 10)}`)
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
      cancelled = true;
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
        "id, name, plant_slug, caption, image_url, location_name, latitude, longitude, created_at, user_id, profiles(username, avatar_url)"
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
      .select("id, username, avatar_url")
      .in("id", partnerIds);

    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const list: Conversation[] = partnerIds.map((partnerId) => {
      const info = seen.get(partnerId)!;
      return {
        partnerId,
        partnerUsername: profileById.get(partnerId)?.username ?? "User",
        avatarUrl: profileById.get(partnerId)?.avatar_url ?? null,
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
        <Avatar uri={item.avatarUrl} size={44} />

        <View className="ml-3 flex-1">
          <Text className="font-bold" style={{ color: "#1A1A1A" }}>
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
          {time.toLowerCase()}
        </Text>
      </Pressable>
    );
  }

  function renderPost({ item }: { item: Post }) {
    const { dateStr, timeStr } = formatDateTime(item.created_at);

    return (
      <View
        className="rounded-2xl p-4 mb-4"
        style={{
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#F0F0F0",
        }}
      >
        <View className="flex-row items-center">
          <Avatar uri={item.profiles?.avatar_url} size={64} />
          <View className="ml-3 flex-1">
            <Text className="font-bold" style={{ color: "#1A1A1A", fontSize: 17 }}>
              {item.profiles?.username ?? "Someone"}
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              Date: {dateStr}
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              Time: {timeStr.toLowerCase()}
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              {item.name}
              {item.plant_slug &&
                getPlantDetailsBySlug(item.plant_slug)?.scientific_name &&
                `(${getPlantDetailsBySlug(item.plant_slug)!.scientific_name})`}
            </Text>
          </View>
        </View>

        <Text className="mt-3" style={{ color: "#1A1A1A", fontSize: 15 }}>
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
              className="rounded-full flex-row items-center"
              style={{
                backgroundColor: "#3B82F6",
                paddingVertical: 9,
                paddingHorizontal: 16,
              }}
            >
              <Image
                source={ICONS.send}
                style={{ width: 18, height: 18, tintColor: "#FFFFFF", marginRight: 8 }}
                resizeMode="contain"
              />
              <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
                Send Message
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
            >
              <Image
                source={ICONS.pin}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#FFFFFF" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Text
        className="text-xl font-bold text-center mt-4"
        style={{ color: "#1A1A1A" }}
      >
        Community
      </Text>

      {/* Tabs */}
      <View className="flex-row mt-4 px-5 mb-2">
        <Pressable
          onPress={() => setActiveTab("feed")}
          className="flex-1 items-center py-3"
          style={{
            backgroundColor: activeTab === "feed" ? "#A3C6B2" : "transparent",
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        >
          <View className="flex-row items-center">
            <Text
              className="font-semibold"
              style={{ color: activeTab === "feed" ? "#1A1A1A" : "#6b7280" }}
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
            backgroundColor: activeTab === "messages" ? "#A3C6B2" : "transparent",
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <View className="flex-row items-center">
            <Text
              className="font-semibold"
              style={{ color: activeTab === "messages" ? "#1A1A1A" : "#6b7280" }}
            >
              Messages
            </Text>
            <TabBadge count={unreadMessages} />
          </View>
        </Pressable>
      </View>

      {/* Content sits on the light-green background below the white header */}
      <View className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
        {/* Search — only shown on News Feed, hidden for guests */}
        {activeTab === "feed" && !isGuest && (
          <View className="px-5 mt-4">
            <View
              className="flex-row items-center rounded-full px-4"
              style={{ backgroundColor: "#FFFFFF", height: 48 }}
            >
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search medicinal plant"
                placeholderTextColor="#9ca3af"
                className="flex-1"
                style={{ color: "#1B4332", padding: 0 }}
              />
              <Image
                source={ICONS.search}
                style={{ width: 32, height: 32, marginLeft: 8 }}
                resizeMode="contain"
              />
            </View>
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
      </View>
    </SafeAreaView>
  );
}