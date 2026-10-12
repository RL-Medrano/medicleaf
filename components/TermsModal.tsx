/**
 * components/TermsModal.tsx
 *
 * ⚠️ LEGAL DISCLAIMER FOR YOU (not shown in the app): This is a starting
 * template, not a finished legal document. Given this app handles user
 * location, photos, and medicinal/health-adjacent information, get this
 * reviewed by an actual lawyer before shipping to real users — especially
 * the medical disclaimer section, which carries real liability
 * considerations for an app suggesting herbal remedies.
 *
 * Update the placeholder contact email/company name before shipping.
 */
import React from "react";
import { Modal, View, Text, Pressable, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function TermsModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <Text className="text-lg font-bold" style={{ color: "#1B4332" }}>
            Terms & Privacy Policy
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text className="text-2xl" style={{ color: "#1B4332" }}>
              ✕
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <Text className="text-xs mt-4" style={{ color: "#6b7280" }}>
            Last updated: October 13, 2026
          </Text>

          <Section title="1. Acceptance of Terms">
            By creating an account or using MedicLeaf ("the App"), you agree
            to these Terms of Service and Privacy Policy. If you do not
            agree, please do not use the App.
          </Section>

          <Section title="2. Not Medical Advice">
            MedicLeaf provides general information about medicinal plants
            for educational and informational purposes only. Plant
            identification results, and any information about traditional
            uses, benefits, or preparation methods, are NOT a substitute
            for professional medical advice, diagnosis, or treatment.
            {"\n\n"}
            Always consult a qualified healthcare provider before using any
            plant for medicinal purposes, especially if you are pregnant,
            nursing, taking medication, or have an existing health
            condition. Never disregard professional medical advice or delay
            seeking it because of something you read in this App.
          </Section>

          <Section title="3. Plant Identification Accuracy">
            Plant identification is performed using an on-device machine
            learning model and may be inaccurate. Misidentifying a plant
            can be dangerous, including the risk of poisoning from plants
            that resemble medicinal ones but are not. Do not consume,
            apply, or otherwise use any plant based solely on this App's
            identification without independent verification from a
            qualified expert.
          </Section>

          <Section title="4. Account Information">
            To use certain features (saving scan history, posting to the
            community, the map, and messaging), you must create an account.
            At sign-up we collect your email address, username, first name,
            and last name — plus your birthdate and gender if you choose to
            provide them. You may instead sign in with Google, which shares
            your name and email with us for that purpose. You agree to
            provide accurate information and are responsible for keeping
            your account secure.
            {"\n\n"}
            As an extra sign-in step, the App asks you to create a 6-digit
            PIN. Only a salted hash of your PIN is stored on our server —
            the PIN itself is never stored and cannot be read by us. If you
            tick "Remember me", your email and password are saved in your
            device's secure storage so you are not asked for them again;
            that saved copy lives only on your device and is removed when
            you turn "Remember me" off or delete your account.
          </Section>

          <Section title="5. Location Data">
            Posts in the App are location-based. When you create a post,
            the App attaches the location of the photo itself: for photos
            you take with the camera, that is the location recorded with
            the photo (or your location at the moment you took it); for
            photos chosen from your gallery, the photo must already contain
            location information — if it does not, the post cannot be
            published. Your location permission is requested only for this
            purpose, and the App does not track your location in the
            background or share your live position with anyone.
            {"\n\n"}
            A post's location (its coordinates and a street-level address
            derived from them) becomes visible to other users on the
            Community feed and on the Map. The Map is view-only: it shows
            where posts were made and never shows where you are.
          </Section>

          <Section title="6. User-Generated Content">
            When you post photos, captions, or messages, you retain
            ownership of that content, but grant MedicLeaf a license to
            display it within the App to other users. You are solely
            responsible for content you post and agree not to post
            content that is unlawful, harmful, or infringes on others'
            rights.
          </Section>

          <Section title="7. Data We Collect">
            We collect only what the App's features need:{"\n\n"}
            (a) account information — email, username, first and last name,
            and birthdate/gender if you provide them (or your Google name
            and email if you sign in with Google);{"\n"}
            (b) a salted hash of your sign-in PIN;{"\n"}
            (c) plant scan photos you choose to save, with the
            identification result, accuracy, date, and time;{"\n"}
            (d) posts you create — photo, caption, plant name, the photo's
            location, and timestamp;{"\n"}
            (e) messages you send to other users, including photos you
            attach to a chat;{"\n"}
            (f) your recent search terms, used to show your Recent
            Searches;{"\n"}
            (g) your profile photo, if you add one.
            {"\n\n"}
            The App contains no advertising and no third-party analytics
            or tracking SDKs.
          </Section>

          <Section title="8. How We Use Your Data">
            Your data is used to operate core App features: identifying
            plants, saving your scan history, displaying your posts and
            profile to other users, enabling messaging and the community
            map, and keeping you signed in securely. We do not sell your
            personal data to third parties and do not use it for
            advertising.
          </Section>

          <Section title="9. Third-Party Services">
            The App uses third-party services to operate: Supabase
            (accounts, database, and server functions), Cloudinary (photo
            and image hosting), Geoapify (map tiles, converting a post's
            coordinates into a readable address, and drawing walking routes
            on the map), and Google Sign-In (alternative sign-in). These
            providers process data on our behalf under their own privacy
            and security practices.
          </Section>

          <Section title="10. Guest Mode">
            You may use the plant scanner and the plant library without
            creating an account. Guest activity stays on your device and is
            not linked to a persistent identity. Scan history, community
            posting, the map, and messaging require a full account.
          </Section>

          <Section title="11. Account Deletion">
            You may delete your account at any time from Delete Account in
            your profile. This permanently erases your profile information,
            scan history, posts and your interactions with other users, and
            app settings and preferences, and removes the credentials saved
            by "Remember me" from your device. This action is permanent and
            cannot be undone.
          </Section>

          <Section title="12. Changes to These Terms">
            We may update these Terms and this Privacy Policy from time to
            time. Continued use of the App after changes constitutes
            acceptance of the updated Terms.
          </Section>

          <Section title="13. Contact Us">
            If you have questions about these Terms or your data, contact
            us at [YOUR CONTACT EMAIL].
          </Section>

          <View style={{ height: 32 }} />
        </ScrollView>

        <View className="px-5 py-4" style={{ backgroundColor: "#FFFFFF" }}>
          <Pressable
            onPress={onClose}
            className="rounded-full py-3 items-center"
            style={{ backgroundColor: "#1B4332" }}
          >
            <Text className="text-white font-bold">Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-5">
      <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
        {title}
      </Text>
      <Text className="text-sm leading-5" style={{ color: "#374151" }}>
        {children}
      </Text>
    </View>
  );
}