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
            Last updated: [DATE]
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
            To use certain features (saving scans, posting to the
            community, messaging), you must create an account. You agree
            to provide accurate information and are responsible for
            maintaining the confidentiality of your account credentials.
          </Section>

          <Section title="5. Location Data">
            If you choose to share your location when posting a plant
            sighting, that location becomes visible to other users of the
            App on the Community Map. You may decline to share location
            for any individual post; doing so will not affect your ability
            to use other features.
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
            We collect: (a) account information (email, username, name);
            (b) photos you capture or upload for plant scanning and
            posting; (c) location data you choose to share; (d) messages
            you send to other users; (e) basic usage data to operate and
            improve the App.
          </Section>

          <Section title="8. How We Use Your Data">
            Your data is used to operate core App features: identifying
            plants, displaying your posts and profile to other users,
            enabling messaging, and showing your saved scan history. We do
            not sell your personal data to third parties.
          </Section>

          <Section title="9. Third-Party Services">
            The App uses third-party services to operate: Supabase (account
            and data storage), Cloudinary (image hosting), and Geoapify
            (maps and location services). These providers process data on
            our behalf under their own privacy and security practices.
          </Section>

          <Section title="10. Guest Mode">
            You may use certain features (plant scanning, plant library)
            without creating an account. Guest sessions are not saved
            permanently and guest activity is not linked to a persistent
            identity. Community and messaging features require a full
            account.
          </Section>

          <Section title="11. Account Deletion">
            You may request account deletion at any time. Deleting your
            account will remove your profile and personal information in
            accordance with applicable law; some content (such as posts
            visible to other users) may be retained or anonymized as
            described at the time of deletion.
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