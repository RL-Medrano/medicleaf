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
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  hidden_for_sender?: boolean;
  hidden_for_receiver?: boolean;
};

// Minimum time between sent messages, to keep someone from spamming the
// thread with a burst of one-word messages or images.
const SEND_COOLDOWN_MS = 800;

const MESSAGE_COLUMNS =
  "id, sender_id, receiver_id, content, image_url, is_read, created_at";

// "10:24 PM" — the timestamp format used in the mockup.
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatScreen() {
  const { userid: partnerId, username } = useLocalSearchParams<{
    userid: string;
    username: string;
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

  // The other person's real profile photo — shown next to their
  // messages instead of a static placeholder icon. Null until loaded,
  // or if they don't have one set (renderMessage falls back to
  // place_holder.png either way).
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  // True only while this screen is focused. init() is async, so it can
  // reach the realtime subscribe long after the focus cleanup has run.
  const focusedRef = useRef(false);
  const listRef = useRef<FlatList<Message>>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  async function init() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    setLoading(false);
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
  async function sendMessage(content: string | null, localImageUri?: string) {
    if (!myId || !partnerId || sending || cooldown) return;
    if (!content && !localImageUri) return;

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
    sendMessage(content);
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

    // Any caption already typed goes along with the photo.
    const caption = draft.trim() || null;
    sendMessage(caption, result.assets[0].uri);
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.sender_id === myId;

    // 78% of the screen; received messages also clear the avatar gutter.
    const maxBubble = bubbleMaxWidth - (isMine ? 0 : 48);

    const bubble = (
      <View
        className="overflow-hidden"
        style={{
          borderRadius: 16,
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
          {bubble}
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
        <View>
          {bubble}
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
          <View className="flex-row items-center">
            <View
              className="flex-1 flex-row items-center"
              style={{
                backgroundColor: "#EDEDED",
                borderRadius: 999,
                height: 48,
                paddingLeft: 18,
                paddingRight: 12,
              }}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a message....."
                placeholderTextColor="#9CA3AF"
                style={{ flex: 1, color: "#1A1A1A", fontSize: 15 }}
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
              style={{ width: 28, height: 28, tintColor: "#FFFFFF" }}
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