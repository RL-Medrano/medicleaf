import React, { useCallback, useState } from "react";
import { View, Text, Image, Modal, Pressable, Alert, StatusBar, Animated, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { checkIsOnline } from "@/utils/network";
import { clearPinVerified } from "@/utils/pin";
import { GuestPrompt } from "@/components/GuestPrompt";
import { Skel, SKELETON_RING, useSkeletonPulse } from "@/components/Skel";

export default function ProfileScreen() {
  const [username, setUsername] = useState("User Name");
  // "Ren Matsunagi" — firstname + lastname from the profiles row, as in the
  // mockup. Falls back to the username for accounts that have no names yet.
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  // True until the first loadProfile() settles. While it's on, the avatar
  // and the name/handle render as skeleton blocks (from the mockup).
  const [loading, setLoading] = useState(true);
  // Full-screen viewer — tapping the profile picture opens it here.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Gentle pulse for those blocks so "still loading" reads clearly.
  const skeletonPulse = useSkeletonPulse(loading);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      // getAuthState() also recognises a local guest (no session at all),
      // which getUser() would have treated as a signed-in member.
      const { user, isGuest: guest } = await getAuthState();
      setIsGuest(guest);

      if (guest || !user) return;

      const { data } = await supabase
        .from("profiles")
        .select("username, firstname, lastname, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        // A Google user who hasn't picked a username yet has null here.
        setUsername(data.username ?? "User Name");
        // Mockup shows the person's full name (firstname + lastname), not the
        // handle — fall back to the handle when the names are still empty.
        setFullName(
          `${data.firstname ?? ""} ${data.lastname ?? ""}`.trim()
        );
        setAvatarUrl(data.avatar_url);
      }
    } finally {
      // Skeleton until this FIRST load settles — content, an empty profile,
      // or a failed query on a bad connection. Runs on every focus but only
      // matters the first time; later visits refresh silently.
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          // signOut needs the server. Offline it fails and can leave the
          // session in place, so don't pretend the user is logged out.
          const online = await checkIsOnline();
          if (!online) {
            Alert.alert("You're offline", "Connect to the internet to log out.");
            return;
          }

          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Couldn't log out", "Please try again.");
            return;
          }

          // Wipe the "PIN already entered" flag, so the next person to sign
          // in on this device is asked for it again.
          await clearPinVerified();
          router.replace("/welcome");
        },
      },
    ]);
  }

  // Opens the About screen (app/about.tsx) — the app's description,
  // key features, and contact details.
  function handleAbout() {
    router.push("/about");
  }

  function handleAllPosts() {
    router.push("/allpost");
  }

  const menuItems = [
    {
      label: "Edit Profile",
      subtitle: "Update your personal information",
      icon: require("@/assets/images/icons/edit icon.png"),
      onPress: () => router.push("/auth/editprofile"),
    },
    {
      label: "Change Password",
      subtitle: "Keep your account secure",
      icon: require("@/assets/images/icons/change password icon.png"),
      onPress: () => router.push("/auth/changepassword"),
    },
    {
      label: "All Post",
      subtitle: "View your published posts",
      icon: require("@/assets/images/icons/all post icon.png"),
      onPress: handleAllPosts,
    },
    {
      label: "About",
      subtitle: "Learn about MedicLeaf",
      icon: require("@/assets/images/icons/help support icon.png"),
      onPress: handleAbout,
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {isGuest ? (
          <GuestPrompt message="Create or Log in your account to view your profile" />
        ) : (
          <>
            {loading ? (
              // Skeleton: large avatar with the name and handle as green
              // pills underneath.
              <View className="items-center mt-8">
                <View
                  style={{
                    width: 190,
                    height: 190,
                    borderRadius: 95,
                    backgroundColor: SKELETON_RING,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Animated.View style={{ opacity: skeletonPulse }}>
                    <Skel w={114} h={114} />
                  </Animated.View>
                </View>
                <Animated.View style={{ opacity: skeletonPulse, alignItems: "center" }}>
                  <Skel w={200} h={24} style={{ marginTop: 14 }} />
                  <Skel w={132} h={16} style={{ marginTop: 8 }} />
                </Animated.View>
              </View>
            ) : (
              <View className="items-center mt-8">
                {/* Tap the profile picture to view it full-screen */}
                <Pressable onPress={() => avatarUrl && setViewerUri(avatarUrl)}>
                  <Image
                    source={
                      avatarUrl
                        ? { uri: avatarUrl }
                        : require("@/assets/images/icons/place_holder.png")
                    }
                    style={{
                      width: 190,
                      height: 190,
                      borderRadius: 95,
                      backgroundColor: "#D1D5DB",
                    }}
                  />
                </Pressable>
                <Text className="text-2xl font-bold mt-4" style={{ color: "#1B4332" }}>
                  {fullName || username}
                </Text>
                <Text className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                  @{username}
                </Text>
              </View>
            )}

            <View className="mt-6" style={{ backgroundColor: "#FFFFFF", borderRadius: 20 }}>
              {menuItems.map((item, index) => (
                <Pressable
                  key={item.label}
                  onPress={item.onPress}
                  className="flex-row items-center px-4 py-4"
                  style={{
                    borderBottomWidth: index === menuItems.length - 1 ? 0 : 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <Image
                    source={item.icon}
                    style={{ width: 54, height: 54, borderRadius: 16 }}
                    resizeMode="contain"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="font-bold" style={{ color: "#1A1A1A", fontSize: 16 }}>
                      {item.label}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, color: "#9ca3af" }}>›</Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-5" style={{ backgroundColor: "#FFFFFF", borderRadius: 20 }}>
              <Pressable
                onPress={() => router.push("/auth/deleteaccount")}
                className="flex-row items-center px-4 py-4"
                style={{ borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
              >
                <Image
                  source={require("@/assets/images/icons/delete icon.png")}
                  style={{ width: 54, height: 54, borderRadius: 16 }}
                  resizeMode="contain"
                />
                <Text className="flex-1 ml-3 font-bold" style={{ color: "#DC2626", fontSize: 16 }}>
                  Delete Account
                </Text>
                <Text style={{ fontSize: 20, color: "#9ca3af" }}>›</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                className="flex-row items-center px-4 py-4"
              >
                <Image
                  source={require("@/assets/images/icons/log out icon.png")}
                  style={{ width: 54, height: 54, borderRadius: 16 }}
                  resizeMode="contain"
                />
                <Text className="flex-1 ml-3 font-bold" style={{ color: "#1A1A1A", fontSize: 16 }}>
                  Logout
                </Text>
                <Text style={{ fontSize: 20, color: "#9ca3af" }}>›</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Image viewer — tap the profile picture to see it full-screen; tap
          anywhere or press Android back to close. */}
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
    </SafeAreaView>
  );
}