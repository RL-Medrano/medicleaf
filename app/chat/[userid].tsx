import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/utils/supabase";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { checkIsOnline } from "@/utils/network";
import { getPlantDetailsBySlug } from "@/utils/plantClassifier";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  image_url: string | null;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  hidden_for_sender?: boolean;
  hidden_for_receiver?: boolean;
};

// A post being inquired about — shown as the green card from the mockup,
// both as the context header (before anything is sent) and attached to
// the first message (so the owner sees it too, permanently).
type InquiredPost = {
  id: string;
  name: string;
  plant_slug: string | null;
  caption: string | null;
  image_url: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

const INQUIRED_POST_COLUMNS =
  "id, name, plant_slug, caption, image_url, created_at, profiles(username, avatar_url)";

// Minimum time between sent messages, to keep someone from spamming the
// thread with a burst of one-word messages or images.
const SEND_COOLDOWN_MS = 800;

const MESSAGE_COLUMNS =
  "id, sender_id, receiver_id, content, image_url, post_id, is_read, created_at";

// "10:24 PM" — the timestamp format used in the mockup.
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatScreen() {
  const { userid: partnerId, username, postId: inquiredPostId } = useLocalSearchParams<{
    userid: string;
    username: string;
    postId?: string;
  }>();

  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  // Full-screen viewer for a tapped image message (sent or received) —
  // holds the image uri while the modal is open, null when closed.
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  // Bubble cap in pixels. The old `maxWidth: "78%"` resolved against
  // auto-sized parent views that themselves size from the bubble — a
  // circular constraint that collapsed text bubbles into a sliver.
  // A definite pixel value always resolves the same way.
  const { width: windowWidth } = useWindowDimensions();
  const bubbleMaxWidth = Math.round(windowWidth * 0.78);

  // The post this chat was opened from via a post's "Send Message"
  // (param). Shown as the context card until the inquiry is sent.
  const [inquiredPost, setInquiredPost] = useState<InquiredPost | null>(null);
  // Posts attached to messages (post_id), keyed by post id — lets the
  // card render on old messages and on the owner's side too.
  const [postCache, setPostCache] = useState<Record<string, InquiredPost>>({});

  // The other person's real profile photo — shown next to their
  // messages instead of a static placeholder icon. Null until loaded,
  // or if they don't have one set (renderMessage falls back to
  // place_holder.png either way).
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  // Mirror of postCache for async helpers (avoids stale-closure reads).
  const postCacheRef = useRef<Record<string, InquiredPost>>({});
  // True only while this screen is focused. init() is async, so it can
  // reach the realtime subscribe long after the focus cleanup has run.
  const focusedRef = useRef(false);
  const listRef = useRef<FlatList<Message>>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One-shot guard: the post card auto-sends once per screen mount. Each
  // press of "Send Message" pushes a FRESH chat screen (new guard), so the
  // same post can be sent again and again — while a refocus of the current
  // screen (init re-runs) never duplicates it.
  const autoSendTriedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      init();
      return () => {
        focusedRef.current = false;
        // Leave the realtime channel when navigating away so we don't
        // keep an open socket subscription per chat ever visited.
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      };
    }, [partnerId])
  );

  // Opening a chat via a post's "Send Message" auto-sends the post card
  // as the first message. That's what the mockup shows (the card sits in
  // the thread with its own timestamp), and it's also what makes the
  // conversation appear in Community → Messages — that list is built
  // purely from `messages` rows, and opening a chat alone writes none.
  // Runs after init() finishes (loading false, thread + post loaded).
  // Deliberately NO "thread already has a card" check: pressing Send
  // Message on the same post again sends the post again.
  useEffect(() => {
    if (loading || !myId || !inquiredPost || autoSendTriedRef.current) return;
    autoSendTriedRef.current = true;
    sendMessage(null, undefined, inquiredPost.id);
  }, [loading, myId, inquiredPost]);

  async function init() {
    setLoading(true);

    // Local session read — same user object, no Auth-server round-trip.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    // A post's "Send Message" is hidden on the user's own posts, but guard
    // here too — messaging yourself would make every sent message also
    // arrive as an "incoming" one from the realtime subscription below.
    if (!user || !partnerId || user.id === partnerId) {
      setLoading(false);
      router.back();
      return;
    }

    setMyId(user.id);
    // Subscribe first, then load history — closes the small gap where a
    // message arriving between the load and the subscribe would otherwise
    // never show up until the next visit to this chat.
    subscribeToNewMessages(user.id, partnerId);
    await loadMessages(user.id, partnerId);
    await markAsRead(user.id, partnerId);
    await loadPartnerAvatar(partnerId);
    // Post context when opened from a post's "Send Message" — the card
    // the owner will recognise the inquiry by.
    if (inquiredPostId) {
      await loadInquiredPost(inquiredPostId);
    }

    setLoading(false);
  }

  async function loadInquiredPost(postId: string) {
    const { data } = await supabase
      .from("posts")
      .select(INQUIRED_POST_COLUMNS)
      .eq("id", postId)
      .maybeSingle();
    if (data) {
      const post = data as unknown as InquiredPost;
      setInquiredPost(post);
      postCacheRef.current[post.id] = post;
      setPostCache({ ...postCacheRef.current });
    }
  }

  // Fetches any not-yet-cached posts referenced by thread messages so
  // their cards can render (old inquiries, owner's side, realtime).
  async function cachePosts(postIds: string[]) {
    const missing = [...new Set(postIds)].filter((id) => !(id in postCacheRef.current));
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("posts")
      .select(INQUIRED_POST_COLUMNS)
      .in("id", missing);
    if (data) {
      const posts = data as unknown as InquiredPost[];
      posts.forEach((p) => {
        postCacheRef.current[p.id] = p;
      });
      setPostCache({ ...postCacheRef.current });
    }
  }

  async function loadPartnerAvatar(otherUserId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", otherUserId)
      .maybeSingle();

    if (data) setPartnerAvatarUrl(data.avatar_url);
  }

  async function loadMessages(currentUserId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(`${MESSAGE_COLUMNS}, hidden_for_sender, hidden_for_receiver`)
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      // A message either side deleted from their own list (Community's
      // "Delete conversation") should stay gone here too, not reappear.
      const visible = data.filter((m) =>
        m.sender_id === currentUserId ? !m.hidden_for_sender : !m.hidden_for_receiver
      );
      setMessages(visible);
      // Warm the post-card cache for any inquiry messages in the thread.
      const referenced = visible
        .map((m) => m.post_id)
        .filter((id): id is string => !!id);
      if (referenced.length > 0) void cachePosts(referenced);
    }
  }

  async function markAsRead(currentUserId: string, otherUserId: string) {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);

    // The UPDATE above only touches rows that were still unread, but every
    // message from them is now read by us either way — mirror that locally so
    // the mutual-view check marks appear without a reload.
    setMessages((prev) =>
      prev.map((m) =>
        m.sender_id === otherUserId && m.receiver_id === currentUserId
          ? { ...m, is_read: true }
          : m
      )
    );
  }

  function subscribeToNewMessages(currentUserId: string, otherUserId: string) {
    // init() awaits several requests before getting here — if the screen
    // lost focus meanwhile, cleanup already ran and this subscription
    // would be orphaned (and channelRef would never be cleared).
    if (!focusedRef.current) return;

    // One channel per open chat, filtered to messages received FROM the
    // other person — outgoing messages are already added locally on send,
    // so we don't need to hear our own inserts echoed back.
    //
    // The random suffix matters: supabase.channel(name) returns the channel
    // still registered under that topic, and attaching postgres_changes
    // callbacks to one that is joining/joined throws "cannot add ...
    // callbacks after subscribe()". removeChannel() resolves asynchronously,
    // so leaving and re-entering a chat quickly can outrun it.
    const channel = supabase
      .channel(
        `chat:${currentUserId}:${otherUserId}:${Math.random().toString(36).slice(2, 10)}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${otherUserId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;

          // The filter above matches ANY message sent by otherUserId, to
          // ANY receiver — guard that it's actually addressed to us before
          // adding it to this thread.
          if (incoming.receiver_id !== currentUserId) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev; // already have it
            return [...prev, incoming];
          });
          // A live inquiry carries its post card — cache it to render.
          if (incoming.post_id) void cachePosts([incoming.post_id]);
          markAsRead(currentUserId, otherUserId);

          setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      // Read receipts: when the OTHER person marks our messages as read,
      // their is_read flips — that UPDATE arrives here so the check marks
      // can appear live instead of on the next visit to this chat.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const updated = payload.new as Message;

          // The filter only matches messages WE sent — to anyone. Ignore
          // threads with other people.
          if (updated.receiver_id !== otherUserId) return;
          if (!updated.is_read) return;

          setMessages((prev) =>
            prev.some((m) => m.id === updated.id)
              ? prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
              : prev
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  }

  function startCooldown() {
    setCooldown(true);
    cooldownTimer.current = setTimeout(() => setCooldown(false), SEND_COOLDOWN_MS);
  }

  /**
   * Shared send path for both a text message and an image message (with an
   * optional caption). `localImageUri` is only used for the optimistic
   * bubble — the real, stored image is whatever Cloudinary returns.
   */
  async function sendMessage(
    content: string | null,
    localImageUri?: string,
    attachedPostId?: string | null
  ) {
    if (!myId || !partnerId || sending || cooldown) return;
    // Allow a card-only message (no text, no photo): the auto-sent post
    // inquiry from "Send Message" is content=null with just post_id set.
    if (!content && !localImageUri && !attachedPostId) return;

    const online = await checkIsOnline();
    if (!online) {
      Alert.alert("You're offline", "Connect to the internet to send this message.");
      return;
    }

    setSending(true);
    setDraft("");

    const tempId = `temp-${Date.now()}`;

    // Optimistic add — show it immediately instead of waiting on the
    // round trip, since this is our own message and we know it's valid.
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: myId,
      receiver_id: partnerId,
      content,
      image_url: localImageUri ?? null,
      post_id: attachedPostId ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      let imageUrl: string | null = null;

      if (localImageUri) {
        const upload = await uploadToCloudinary(localImageUri, "messages");
        imageUrl = upload.url;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: myId,
          receiver_id: partnerId,
          content,
          image_url: imageUrl,
          post_id: attachedPostId ?? null,
        })
        .select(MESSAGE_COLUMNS)
        .single();

      if (error || !data) throw error ?? new Error("Failed to send message");

      // Swap the temp message for the real one (real id, server timestamp,
      // final Cloudinary URL).
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      startCooldown();
    } catch (err) {
      console.error("[chat] send failed:", err);
      // Roll back the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (content) setDraft(content);
      Alert.alert("Couldn't send", "Your message wasn't sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleSend() {
    const content = draft.trim();
    if (!content) return;
    // First message after opening from "Send Message" carries the post —
    // that's the card the owner recognises the inquiry by. Later messages
    // (or threads that already reference a post) send plain.
    const attachPostId =
      inquiredPost && !messages.some((m) => m.post_id) ? inquiredPost.id : null;
    sendMessage(content, undefined, attachPostId);
  }

  async function handlePickImage() {
    if (sending || cooldown) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo library permission needed",
        "Please allow photo library access to send a photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    // Any caption already typed goes along with the photo. Same
    // post-attach rule as text (see handleSend).
    const caption = draft.trim() || null;
    const attachPostId =
      inquiredPost && !messages.some((m) => m.post_id) ? inquiredPost.id : null;
    sendMessage(caption, result.assets[0].uri, attachPostId);
  }

  // Tapping a post card — either side of the conversation — jumps to
  // where the post lives: the Community News Feed, which scrolls to the
  // post and briefly highlights it (?focusPost).
  function openPostInFeed(postId: string) {
    router.navigate({
      pathname: "/tab/community",
      params: { tab: "feed", focusPost: postId },
    } as any);
  }

  function formatPostDateTime(createdAt: string) {
    const date = new Date(createdAt);
    return {
      dateStr: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      timeStr: date
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase(),
    };
  }

  // Green post card from the mockup: bright-green outer bubble, white
  // inner card with poster, date/time, plant, caption, and photo.
  //
  // The card gets an EXPLICIT width (not just maxWidth): sizing it from
  // its own content while the photo inside is width:"100%" of that same
  // content is a circular constraint — on some devices it collapsed the
  // text column to nothing and rendered a blank white box.
  function renderPostCard(post: InquiredPost, cardWidth: number, mine: boolean) {
    const { dateStr, timeStr } = formatPostDateTime(post.created_at);
    const scientific = post.plant_slug
      ? getPlantDetailsBySlug(post.plant_slug)?.scientific_name
      : null;
    return (
      <Pressable
        onPress={() => openPostInFeed(post.id)}
        style={{
          width: cardWidth,
          borderRadius: 18,
          // Mockup: MY card has a square bottom-right corner (the sent
          // bubble's "tail"); a received card mirrors it with a square
          // bottom-left corner, pointing at the avatar side.
          borderBottomRightRadius: mine ? 0 : 18,
          borderBottomLeftRadius: mine ? 18 : 0,
          backgroundColor: "#2BB24C",
          padding: 10,
        }}
      >
        <View
          style={{
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            padding: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={
                post.profiles?.avatar_url
                  ? { uri: post.profiles.avatar_url }
                  : require("@/assets/images/icons/place_holder.png")
              }
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#E5E7EB",
              }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontWeight: "bold", color: "#1A1A1A", fontSize: 15 }}
              >
                {post.profiles?.username ?? "Someone"}
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, lineHeight: 16 }}>
                Date: {dateStr}
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, lineHeight: 16 }}>
                Time: {timeStr}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: "#6B7280", fontSize: 12, lineHeight: 16 }}
              >
                {post.name}
                {scientific ? `(${scientific})` : ""}
              </Text>
            </View>
          </View>
          <Text style={{ color: "#1A1A1A", fontSize: 15, lineHeight: 20, marginTop: 10 }}>
            {post.caption ?? `Found ${post.name}!`}
          </Text>
          <Image
            source={{ uri: post.image_url }}
            style={{
              width: "100%",
              height: 110,
              borderRadius: 10,
              marginTop: 10,
              backgroundColor: "#F3F4F6",
            }}
            resizeMode="cover"
          />
        </View>
      </Pressable>
    );
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.sender_id === myId;

    // 78% of the screen; received messages also clear the avatar gutter.
    const maxBubble = bubbleMaxWidth - (isMine ? 0 : 48);

    // Inquiry card, when this message references a post (and its details
    // have loaded) — renders above the message's own bubble.
    const attachedPost = item.post_id ? postCache[item.post_id] ?? null : null;

    const bubble = (
      <View
        className="overflow-hidden"
        style={{
          borderRadius: 16,
          // Same shape rule as the post card: sent bubbles end in a
          // square bottom-right corner, received ones mirror it with a
          // square bottom-left corner (the mockup's white reply bubble).
          borderBottomRightRadius: isMine ? 0 : 16,
          borderBottomLeftRadius: isMine ? 16 : 0,
          backgroundColor: isMine ? "#2BB24C" : "#FFFFFF",
          maxWidth: maxBubble,
        }}
      >
        {item.image_url && (
          // Tap the image to open it full-screen.
          <Pressable onPress={() => setViewerUri(item.image_url)}>
            <Image
              source={{ uri: item.image_url }}
              style={{ width: 200, height: 200 }}
              resizeMode="cover"
            />
          </Pressable>
        )}
        {item.content && (
          <Text
            style={{
              color: isMine ? "#FFFFFF" : "#1A1A1A",
              fontSize: 15,
              lineHeight: 21,
              paddingHorizontal: 14,
              paddingVertical: 11,
            }}
          >
            {item.content}
          </Text>
        )}
      </View>
    );

    // Read receipt: a green check after MY timestamp once the other
    // person has opened the chat and read the message — the mockup's
    // "10:24 PM ✓". Received messages don't carry a check.
    const check =
      isMine && item.is_read ? (
        <Image
          source={require("@/assets/images/icons/Check.png")}
          style={{ width: 15, height: 15, tintColor: "#2BB24C" }}
          resizeMode="contain"
        />
      ) : null;

    if (isMine) {
      return (
        <View style={{ alignItems: "flex-end", marginBottom: 16 }}>
          {attachedPost && renderPostCard(attachedPost, maxBubble, true)}
          {(item.content || item.image_url) && (
            <View style={{ marginTop: attachedPost ? 8 : 0 }}>{bubble}</View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 5,
            }}
          >
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              {formatTime(item.created_at)}
            </Text>
            {check}
          </View>
        </View>
      );
    }

    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Image
          source={
            partnerAvatarUrl
              ? { uri: partnerAvatarUrl }
              : require("@/assets/images/icons/place_holder.png")
          }
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            marginRight: 10,
            backgroundColor: "#E5E7EB",
          }}
          resizeMode="cover"
        />
        <View style={{ alignItems: "flex-start" }}>
          {attachedPost && renderPostCard(attachedPost, maxBubble, false)}
          {(item.content || item.image_url) && (
            <View style={{ marginTop: attachedPost ? 8 : 0 }}>{bubble}</View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 5,
            }}
          >
            <Text style={{ fontSize: 12, color: "#2BB24C" }}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const sendDisabled = !draft.trim() || sending || cooldown;
  const imageButtonDisabled = sending || cooldown;

  // Context card: the post this chat was opened from, shown until the
  // inquiry itself (carrying the same card) is sent.
  const showContextCard =
    !!inquiredPost && !messages.some((m) => m.post_id);

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#F5F5F5" }}>
        <View className="flex-row items-center px-4 py-2.5">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Image
              source={require("@/assets/images/icons/arrow_left.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Pressable>
          <Image
            source={
              partnerAvatarUrl
                ? { uri: partnerAvatarUrl }
                : require("@/assets/images/icons/place_holder.png")
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              marginLeft: 14,
              backgroundColor: "#E5E7EB",
            }}
            resizeMode="cover"
          />
          <Text
            className="font-bold ml-3"
            style={{ fontSize: 20, color: "#1A1A1A" }}
          >
            {username ?? "Chat"}
          </Text>
        </View>
      </SafeAreaView>

      {/* behavior="padding" lifts the composer by the keyboard height; with
          keyboardVerticalOffset at 0 the KAV's own frame (it reaches the
          screen bottom) does the rest — the old offset of 90 made it float
          90px above the keyboard. */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1B4332" />
          </View>
        ) : (
          <>
            {showContextCard && inquiredPost && (
              <View
                style={{
                  alignItems: "flex-end",
                  paddingHorizontal: 16,
                  paddingTop: 16,
                }}
              >
                {renderPostCard(inquiredPost, bubbleMaxWidth, true)}
              </View>
            )}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              className="flex-1 px-4"
              contentContainerStyle={{ paddingVertical: 16 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: false })
              }
            />
          </>
        )}

        {/* Composer */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: 10 + insets.bottom,
          }}
        >
          <View className="flex-row items-end">
            <View
              className="flex-1 flex-row items-end"
              style={{
                backgroundColor: "#EDEDED",
                borderRadius: 24,
                minHeight: 48,
                maxHeight: 128,
                paddingLeft: 18,
                paddingRight: 12,
                paddingVertical: 6,
              }}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message....."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                style={{
                  flex: 1,
                  color: "#1A1A1A",
                  fontSize: 15,
                  lineHeight: 21,
                  maxHeight: 116,
                  paddingVertical: 8,
                }}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Pressable
                onPress={handlePickImage}
                disabled={imageButtonDisabled}
                hitSlop={8}
                style={{ opacity: imageButtonDisabled ? 0.4 : 1 }}
              >
                <Image
                  source={require("@/assets/images/icons/image_icon.png")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={handleSend}
              disabled={sendDisabled}
              hitSlop={8}
              style={{ marginLeft: 10, opacity: sendDisabled ? 0.5 : 1 }}
            >
              {sending ? (
                <View
                  className="items-center justify-center"
                  style={{ width: 46, height: 46 }}
                >
                  <ActivityIndicator color="#2E7D5B" />
                </View>
              ) : (
                <Image
                  source={require("@/assets/images/icons/send_icon.png")}
                  style={{ width: 46, height: 46 }}
                  resizeMode="contain"
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image viewer — tap any image message (sent or received) to see
          it full-screen; tap anywhere or press Android back to close. */}
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
    </View>
  );
}