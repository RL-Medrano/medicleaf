import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  // The other person's real profile photo — shown next to their
  // messages instead of a static placeholder icon. Null until loaded,
  // or if they don't have one set (renderMessage falls back to
  // place_holder.png either way).
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      init();
      return () => {
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
  }

  function subscribeToNewMessages(currentUserId: string, otherUserId: string) {
    // One channel per open chat, filtered to messages received FROM the
    // other person — outgoing messages are already added locally on send,
    // so we don't need to hear our own inserts echoed back.
    const channel = supabase
      .channel(`chat:${currentUserId}:${otherUserId}`)
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

    return (
      <View
        className="flex-row mb-3"
        style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}
      >
        {!isMine && (
          <Image
            source={
              partnerAvatarUrl
                ? { uri: partnerAvatarUrl }
                : require("@/assets/images/icons/place_holder.png")
            }
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              marginRight: 8,
              backgroundColor: "#D8F3DC",
            }}
            resizeMode="cover"
          />
        )}

        <View
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: isMine ? "#B7E4C7" : "#FFFFFF",
            maxWidth: "75%",
          }}
        >
          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: 200, height: 200 }}
              resizeMode="cover"
            />
          )}
          {item.content && (
            <Text
              style={{
                color: "#1B4332",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const sendDisabled = !draft.trim() || sending || cooldown;
  const imageButtonDisabled = sending || cooldown;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View
        className="flex-row items-center px-5 py-3"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-2xl" style={{ color: "#1B4332" }}>
            ←
          </Text>
        </Pressable>
        <Text className="text-lg font-bold ml-4" style={{ color: "#1B4332" }}>
          {username ?? "Chat"}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
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
            className="flex-1 px-5"
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Composer */}
        <View className="px-5 pb-4">
          <View
            className="rounded-2xl px-4 pt-3 pb-2"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Aa"
              placeholderTextColor="#9ca3af"
              multiline
              style={{ color: "#1B4332", minHeight: 36 }}
            />
            <View className="flex-row items-center justify-between mt-2">
              <Pressable
                onPress={handlePickImage}
                disabled={imageButtonDisabled}
                hitSlop={8}
                style={{ opacity: imageButtonDisabled ? 0.4 : 1 }}
              >
                <Image
                  source={require("@/assets/images/icons/image.png")}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
              </Pressable>

              <Pressable
                onPress={handleSend}
                disabled={sendDisabled}
                className="rounded-full items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: draft.trim() && !sendDisabled ? "#1B4332" : "#d1d5db",
                }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF" }}>↑</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}