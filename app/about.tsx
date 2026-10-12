import React from "react";
import { View, Text, Image, Pressable, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

// ── Contact details ────────────────────────────────────────────────────────
// PLACEHOLDER — the mockup shows the row labels, not the real values yet.
// Drop the actual support email / landline in here and the screen updates.
const CONTACT_EMAIL = "Email address";
const CONTACT_PHONE = "Landline number";

const FEATURES = [
  { label: "Medicinal Plant Scanning", icon: require("@/assets/images/icons/leaf.png") },
  { label: "Scan History & Accuracy Results", icon: require("@/assets/images/icons/historys.png") },
  { label: "Community Posts & Messaging", icon: require("@/assets/images/icons/users.png") },
  { label: "Map & User Profiles", icon: require("@/assets/images/icons/maps.png") },
];

const CONTACTS = [
  { label: CONTACT_EMAIL, icon: require("@/assets/images/icons/mail.png") },
  { label: CONTACT_PHONE, icon: require("@/assets/images/icons/phone.png") },
];

export default function AboutScreen() {
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#D8F3DC" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      {/* Header — back arrow + centred title */}
      <View className="flex-row items-center justify-center py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ position: "absolute", left: 0 }}
        >
          <Image
            source={require("@/assets/images/icons/arrow_left.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </Pressable>
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-lg font-bold"
          style={{ color: "#1A1A1A" }}
        >
          About
        </Text>
      </View>

      {/* flexGrow:1 + the flex-1 spacer below keeps "Contact MedicLeaf"
          pinned near the bottom when the content is short, as in the mockup. */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          flexGrow: 1,
        }}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-3xl font-bold text-center mt-6"
          style={{ color: "#1A1A1A" }}
        >
          MedicLeaf
        </Text>

        <Text
          maxFontSizeMultiplier={1.2}
          className="mt-3 text-sm"
          style={{ color: "#6b7280", textAlign: "justify", lineHeight: 22 }}
        >
          MedicLeaf helps you explore medicinal plants. Scan plants to view
          identification and accuracy results, revisit your scan history, and
          connect through community posts and messaging. The app also includes a
          map and user profiles.
        </Text>

        <Text
          maxFontSizeMultiplier={1.2}
          className="mt-8 text-lg font-bold"
          style={{ color: "#1A1A1A" }}
        >
          Key Features
        </Text>
        {FEATURES.map((feature) => (
          <View
            key={feature.label}
            className="flex-row items-center mt-4"
            style={{ gap: 12 }}
          >
            <Image
              source={feature.icon}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-base flex-1"
              style={{ color: "#1A1A1A" }}
            >
              {feature.label}
            </Text>
          </View>
        ))}

        <View className="flex-1" style={{ minHeight: 48 }} />

        <Text
          maxFontSizeMultiplier={1.2}
          className="text-lg font-bold"
          style={{ color: "#1A1A1A" }}
        >
          Contact MedicLeaf
        </Text>
        {CONTACTS.map((contact) => (
          <View
            key={contact.label}
            className="flex-row items-center mt-4"
            style={{ gap: 12 }}
          >
            <Image
              source={contact.icon}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-sm flex-1"
              style={{ color: "#6b7280" }}
            >
              {contact.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
