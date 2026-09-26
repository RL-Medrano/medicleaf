import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  useWindowDimensions,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const slides = [
  {
    id: "1",
    image: require("@/assets/images/logo/ob1.png"),
    text: "Scan and learn medicinal plants instantly.",
  },
  {
    id: "2",
    image: require("@/assets/images/logo/ob2.png"),
    text: "Search plants by name or health issue.",
  },
  {
    id: "3",
    image: require("@/assets/images/logo/ob3.png"),
    text: "Share your discoveries with the community.",
  },
];

export default function OnboardingStartScreen() {
  // Live width instead of a value read once at startup, so the slides and
  // the swipe math stay correct if the window size changes.
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const finishingRef = useRef(false);

  async function goToOnboardingEnd() {
    if (finishingRef.current) return; // ignore double taps
    finishingRef.current = true;

    // Mark the carousel itself as seen — separate from hasSeenGetStarted,
    // so closing the app between these two screens resumes at
    // get_started next time, instead of restarting the whole carousel.
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
    } catch (err) {
      // Not fatal — the user just sees onboarding again next launch.
      console.error("[onboarding] failed to save flag:", err);
    }
    router.replace("/get_started");
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  function handleNext() {
    if (activeIndex < slides.length - 1) {
      const next = activeIndex + 1;
      setActiveIndex(next); // update immediately so quick taps don't repeat
      flatListRef.current?.scrollToIndex({ index: next });
    } else {
      goToOnboardingEnd();
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      <View className="items-end px-6 pt-2">
        <Pressable onPress={goToOnboardingEnd}>
          <Text className="font-bold text-base" style={{ color: "#1B4332" }}>
            Skip
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center px-10 mt-16">
            <View
              className="rounded-2xl p-4"
              style={{ borderWidth: 4, borderColor: "#40916C" }}
            >
              <Image
                source={item.image}
                style={{ width: 190, height: 190 }}
                resizeMode="contain"
              />
            </View>
            <Text
              className="text-lg font-bold text-center mt-8"
              style={{ color: "#1B4332" }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View className="flex-row justify-center mb-6">
        {slides.map((_, index) => (
          <View
            key={index}
            className="h-2 w-2 rounded-full mx-1"
            style={{
              backgroundColor: index === activeIndex ? "#1B4332" : "#B7E4C7",
            }}
          />
        ))}
      </View>

      <View className="px-6 mb-4">
        <Pressable
          onPress={handleNext}
          className="rounded-full py-4 items-center shadow-sm"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <Text className="font-bold text-base" style={{ color: "#2D6A4F" }}>
            {activeIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}