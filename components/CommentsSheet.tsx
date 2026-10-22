/**
 * components/CommentsSheet.tsx
 *
 * The "Comments" sheet from the News Feed mockup. A floating white card
 * over the Community screen (NO dark backdrop — the mockup keeps the
 * header tabs and the bottom tab bar fully visible), listing a post's
 * comments NEWEST first: avatar, name, relative time right-aligned,
 * comment text, and a paper-plane under each row.
 *
 * The paper-plane opens a chat with that commenter via the existing
 * /chat/[userid] screen, passing the post id — that screen auto-sends
 * the post card as the first message (the exact mechanic the feed's
 * "Send Message" button already uses). It's hidden on your own comments
 * because chat refuses self-conversations.
 *
 * Guest note: guests never reach this sheet — Community replaces the
 * whole feed with GuestPrompt, so the comment icon on the card only
 * renders for signed-in users. The RLS policies on `comments`
 * (create-comments-table.sql) are the second line of defence.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/utils/supabase";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

type Props = {
  visible: boolean;
  postId: string | null;
  currentUserId: string | null;
  onClose: () => void;
  /** Paper-plane on a comment row — opens the chat with that commenter
   *  and (via postId) shares the post they commented on. */
  onSendToChat: (userId: string, username: string) => void;
};

// Icons live in assets/images/icons/.
const ICONS = {
  close: require("@/assets/images/icons/close.png"),
  send: require("@/assets/images/icons/send icon.png"),
};

// Distance from the top of the screen to where the sheet starts: the
// Community header ("Community" title + News Feed/Messages tabs) sits at
// roughly this height, so the sheet lands just below the tabs like the
// mockup (status-bar inset included via insets.top).
const HEADER_BELOW_TABS = 130;
// app/tab/_layout.tsx uses the default bottom-tab bar (no custom height)
// — ~49px + the bottom inset. This keeps the bar visible below the sheet.
const TAB_BAR_HEIGHT = 56;

/** "2h ago" / "1d ago" — the relative stamp shown on each comment row. */
function timeAgo(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Grey circle + person placeholder — same recipe as community.tsx's Avatar.
function Avatar({ uri, size }: { uri: string | null | undefined; size: number }) {
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
        source={uri ? { uri } : require("@/assets/images/icons/place_holder.png")}
        style={{ width: size, height: size }}
        resizeMode={uri ? "cover" : "contain"}
      />
    </View>
  );
}

export function CommentsSheet({
  visible,
  postId,
  currentUserId,
  onClose,
  onSendToChat,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Comment>>(null);

  // Fresh fetch on every open — short-lived reads, deliberately uncached.
  useEffect(() => {
    if (visible && postId) {
      setDraft("");
      loadComments(postId);
    }
    // loadComments only depends on the id it's given.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, postId]);

  async function loadComments(id: string) {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, post_id, user_id, content, created_at, profiles(username, avatar_url)"
        )
        .eq("post_id", id)
        // Newest first, matching the mockup (2h, 5h, 1d, 1d top → down).
        .order("created_at", { ascending: false })
        .limit(200);
      if (error || !data) {
        setLoadFailed(true);
        setComments([]);
      } else {
        setComments(data as unknown as Comment[]);
      }
    } catch {
      // Network failure — the client rejects instead of returning an
      // error object (same handling as the feed's loadPosts).
      setLoadFailed(true);
      setComments([]);
    }
    setLoading(false);
  }

  async function postComment() {
    const text = draft.trim();
    if (!text || !postId || !currentUserId || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: text,
      });
      if (error) throw error;
      setDraft("");
      // loadComments handles its own errors, so a failure here never
      // reaches the catch — the alert below only ever means the INSERT
      // failed, and the draft stays in the input.
      await loadComments(postId);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch {
      Alert.alert("Couldn't post comment", "Please try again.");
    } finally {
      setSending(false);
    }
  }

  function confirmDelete(comment: Comment) {
    // Long-press removal for your OWN comments only (the RLS delete
    // policy enforces the same rule server-side).
    if (comment.user_id !== currentUserId) return;
    Alert.alert("Delete comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("comments")
              .delete()
              .eq("id", comment.id);
            if (error) throw error;
            if (postId) await loadComments(postId);
          } catch {
            Alert.alert("Couldn't delete", "Please try again.");
          }
        },
      },
    ]);
  }

  function renderComment({ item }: { item: Comment }) {
    const isMine = !!currentUserId && item.user_id === currentUserId;
    const username = item.profiles?.username ?? "Someone";

    return (
      <View className="flex-row mb-5">
        <Avatar uri={item.profiles?.avatar_url} size={40} />
        <View className="flex-1 ml-3">
          <View className="flex-row items-start">
            <Text
              className="font-bold flex-1"
              style={{ fontSize: 15, color: "#1A1A1A" }}
            >
              {username}
            </Text>
            <Text
              style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8, marginTop: 2 }}
            >
              {timeAgo(item.created_at)}
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: "#1A1A1A", lineHeight: 20, marginTop: 3 }}>
            {item.content}
          </Text>

          {/* Message this commenter about this post. Hidden on your own
              rows — the chat screen bounces back on self-conversations. */}
          {!isMine && (
            <Pressable
              onPress={() => onSendToChat(item.user_id, username)}
              hitSlop={10}
              className="self-end mt-1.5"
            >
              <Image
                source={ICONS.send}
                style={{ width: 20, height: 20, tintColor: "#1A1A1A" }}
                resizeMode="contain"
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tap outside the sheet to close. No dim — the mockup shows the
          Community screen at full brightness behind the floating card. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Same keyboard handling as the chat screen: behavior="padding"
          lifts the composer above the keyboard (RN Modal windows don't
          resize with the soft keyboard on Android, so this is what makes
          the input reachable there). */}
      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 18,
            paddingTop: insets.top + HEADER_BELOW_TABS,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            {/* Header — centered title, close on the right (mockup). */}
            <View
              className="flex-row items-center"
              style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }}
            >
              {/* Invisible spacer balances the close button so the title
                  is centered on the full sheet width. */}
              <View style={{ width: 24 }} />
              <Text
                className="flex-1 text-center font-bold"
                style={{ fontSize: 20, color: "#1A1A1A" }}
              >
                Comments
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Image source={ICONS.close} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </Pressable>
            </View>

            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#1B4332" />
              </View>
            ) : loadFailed ? (
              <Pressable
                className="flex-1 items-center justify-center px-8"
                onPress={() => postId && loadComments(postId)}
              >
                <Text className="text-center" style={{ color: "#6b7280" }}>
                  Couldn't load comments.{"\n"}Tap to try again.
                </Text>
              </Pressable>
            ) : (
              <FlatList
                ref={listRef}
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View className="items-center mt-10 px-6">
                    <Text className="text-center" style={{ color: "#6b7280" }}>
                      No comments yet. Be the first to comment!
                    </Text>
                  </View>
                }
              />
            )}

            {/* Composer — grey avatar, pill input, black send circle.
                Rendered only with a signed-in user (the sheet is
                unreachable for guests anyway; this keeps an insert from
                ever being attempted without a user id). */}
            {currentUserId && (
              <View className="flex-row items-center" style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <Avatar uri={null} size={40} />
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Write a comment..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1"
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={postComment}
                  style={{
                    backgroundColor: "#F0F0F0",
                    borderRadius: 24,
                    marginHorizontal: 10,
                    minHeight: 44,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: "#1A1A1A",
                  }}
                />
                <Pressable
                  onPress={postComment}
                  disabled={!draft.trim() || sending}
                  className="items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#1A1A1A",
                    opacity: draft.trim() && !sending ? 1 : 0.45,
                  }}
                >
                  <Image
                    source={ICONS.send}
                    style={{ width: 20, height: 20, tintColor: "#FFFFFF" }}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
