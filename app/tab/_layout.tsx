import React, { useEffect, useState } from "react";
import { Tabs, router, usePathname } from "expo-router";
import { Image, Alert, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

const LAST_SEEN_COMMUNITY_KEY = "lastSeenCommunityAt";

export default function TabsLayout() {
  const [isGuest, setIsGuest] = useState(false);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkGuestStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkGuestStatus();
      checkNewActivity();
    });

    // Realtime — react immediately to a new message or post arriving
    // while the app is open, instead of only checking on navigation.
    //
    // The topic gets a fresh suffix on every mount on purpose:
    // supabase.channel(name) returns the channel already registered under
    // that topic, and attaching postgres_changes callbacks to a channel that
    // is joining/joined throws "cannot add ... callbacks after subscribe()".
    // removeChannel() only finishes asynchronously, so a remount (Strict
    // Mode in dev, Fast Refresh) can run before the previous channel is
    // gone. The old channel is still removed by reference in cleanup below.
    const channel = supabase
      .channel(`tab-activity-indicator-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => checkNewActivity()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => checkNewActivity()
      )
      .subscribe();

    checkNewActivity();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-check whenever the user navigates anywhere — cheap query, and
  // it's what naturally clears the message-unread part of the dot
  // after they've read messages in a chat and come back.
  useEffect(() => {
    checkNewActivity();

    // Landing on Community itself means they've now seen whatever
    // posts existed at this moment — record that, so new-post
    // detection resets from here.
    if (pathname?.includes("/tab/community")) {
      AsyncStorage.setItem(LAST_SEEN_COMMUNITY_KEY, new Date().toISOString());
    }
  }, [pathname]);

  async function checkGuestStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsGuest(!!user?.is_anonymous);
  }

  async function checkNewActivity() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.is_anonymous) {
      setHasNewActivity(false);
      return;
    }

    const [unreadResult, latestPostResult, lastSeenRaw] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false)
        .eq("hidden_for_receiver", false),
      supabase
        .from("posts")
        .select("created_at")
        .neq("user_id", user.id) // only OTHER users' posts count as "new"
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      AsyncStorage.getItem(LAST_SEEN_COMMUNITY_KEY),
    ]);

    const hasUnreadMessages = (unreadResult.count ?? 0) > 0;

    let hasNewPost = false;
    if (latestPostResult.data?.created_at) {
      if (!lastSeenRaw) {
        // Never visited Community yet — treat any existing post from
        // someone else as new.
        hasNewPost = true;
      } else {
        hasNewPost = new Date(latestPostResult.data.created_at) > new Date(lastSeenRaw);
      }
    }

    setHasNewActivity(hasUnreadMessages || hasNewPost);
  }

  function handleRestrictedPress(e: { preventDefault: () => void }) {
    if (isGuest) {
      e.preventDefault();
      Alert.alert(
        "Account Required",
        "Please create an account or log in to access this feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => router.push("/auth/login") },
          { text: "Sign Up", onPress: () => router.push("/auth/signup") },
        ]
      );
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1B4332",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/Home.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) => (
            <View>
              <Image
                source={require("@/assets/images/icons/Community.png")}
                style={{ width: 24, height: 24, tintColor: color }}
              />
              {!isGuest && hasNewActivity && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#22C55E",
                    borderWidth: 1.5,
                    borderColor: "#FFFFFF",
                  }}
                />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: handleRestrictedPress,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/History.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
        listeners={{
          tabPress: handleRestrictedPress,
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/Map.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
        listeners={{
          tabPress: handleRestrictedPress,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/user.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
        listeners={{
          tabPress: handleRestrictedPress,
        }}
      />
    </Tabs>
  );
}