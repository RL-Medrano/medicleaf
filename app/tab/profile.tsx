import React, { useCallback, useState } from "react";
import { View, Text, Image, Pressable, Alert, StatusBar, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { checkIsOnline } from "@/utils/network";
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
          router.replace("/welcome");
        },
      },
    ]);
  }

  function handleHelpSupport() {
    router.push("/helpsupport");
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
      label: "Help & Support",
      subtitle: "Get assistance and FAQs",
      icon: require("@/assets/images/icons/help support icon.png"),
      onPress: handleHelpSupport,
    },
    {
      label: "All Post",
      subtitle: "View your published posts",
      icon: require("@/assets/images/icons/all post icon.png"),
      onPress: handleAllPosts,
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="px-6 flex-1">
        <Text className="text-xl font-bold text-center mt-2" style={{ color: "#1B4332" }}>
          Profile
        </Text>

        {isGuest ? (
          <GuestPrompt message="Create or Log in your account to view your profile" />
        ) : (
          <>
            {loading ? (
              // Skeleton from the mockup: moss ring + green core, with the
              // name and handle as green pills underneath.
              <View className="items-center mt-6">
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: SKELETON_RING,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Animated.View style={{ opacity: skeletonPulse }}>
                    <Skel w={66} h={66} />
                  </Animated.View>
                </View>
                <Animated.View style={{ opacity: skeletonPulse, alignItems: "center" }}>
                  <Skel w={200} h={24} style={{ marginTop: 14 }} />
                  <Skel w={132} h={16} style={{ marginTop: 8 }} />
                </Animated.View>
              </View>
            ) : (
              <View className="items-center mt-6">
                <Image
                  source={
                    avatarUrl
                      ? { uri: avatarUrl }
                      : require("@/assets/images/icons/place_holder.png")
                  }
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: "#D1D5DB",
                  }}
                />
                <Text className="text-xl font-bold mt-3" style={{ color: "#1B4332" }}>
                  {fullName || username}
                </Text>
                <Text className="text-sm" style={{ color: "#6b7280" }}>
                  @{username}
                </Text>
              </View>
            )}

            <View className="rounded-2xl mt-6" style={{ backgroundColor: "#FFFFFF" }}>
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
                  <View
                    className="rounded-xl items-center justify-center"
                    style={{ width: 40, height: 40, backgroundColor: "#D8F3DC" }}
                  >
                    <Image
                      source={item.icon}
                      style={{ width: 40, height: 40 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-bold" style={{ color: "#1B4332" }}>
                      {item.label}
                    </Text>
                    <Text className="text-xs" style={{ color: "#6b7280" }}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Image
                    source={require("@/assets/images/icons/Chevron_right3.png")}
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>

            <View className="flex-1" />

            <View className="rounded-2xl mb-6" style={{ backgroundColor: "#FFFFFF" }}>
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center px-4 py-4"
                style={{ borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
              >
                <View
                  className="rounded-xl items-center justify-center"
                  style={{ width: 40, height: 40, backgroundColor: "#D8F3DC" }}
                >
                  <Image
                    source={require("@/assets/images/icons/log out icon.png")}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="flex-1 ml-3 font-bold" style={{ color: "#1B4332" }}>
                  Logout
                </Text>
                <Image
                  source={require("@/assets/images/icons/Chevron_right3.png")}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
              </Pressable>

              <Pressable
                onPress={() => router.push("/auth/deleteaccount")}
                className="flex-row items-center px-4 py-4"
              >
                <View
                  className="rounded-xl items-center justify-center"
                  style={{ width: 40, height: 40, backgroundColor: "#FEE2E2" }}
                >
                  <Image
                    source={require("@/assets/images/icons/delete icon.png")}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="flex-1 ml-3 font-bold" style={{ color: "#DC2626" }}>
                  Delete Account
                </Text>
                <Image
                  source={require("@/assets/images/icons/Chevron_right3.png")}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}