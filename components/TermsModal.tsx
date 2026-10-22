/**
 * components/TermsModal.tsx
 *
 * The sign-up screen's "Terms and Privacy Policy" link opens this sheet
 * (also the reason the checkbox label mentions both). Two documents in
 * one scroll:
 *
 *   1. MEDICLEAF APP — Terms and Conditions (Effective October 22, 2026),
 *      the official text supplied for the end of sign-up.
 *   2. Privacy Policy (October 13, 2026) — the data-handling detail that
 *      section 10 of the Terms points readers to.
 *
 * ⚠️ LEGAL DISCLAIMER FOR YOU (not shown in the app): this app handles
 * user location, photos, and medicinal/health-adjacent information —
 * still worth a lawyer's review before shipping to real users, and fill
 * in the official contact information referenced in section 17.
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
          {/* Document 1 — Terms and Conditions */}
          <View className="items-center mt-5">
            <Text className="text-base font-bold" style={{ color: "#1B4332" }}>
              MEDICLEAF APP
            </Text>
            <Text className="text-base font-bold" style={{ color: "#1B4332" }}>
              TERMS AND CONDITIONS
            </Text>
          </View>
          <Text className="text-xs mt-2" style={{ color: "#6b7280" }}>
            Effective Date: October 22, 2026
          </Text>

          <Section title="1. Acceptance of Terms">
            By accessing or using the MedicLeaf App, you agree to comply with
            these Terms and Conditions. If you do not agree with any part of
            these terms, please discontinue using the application.
            {"\n\n"}
            MedicLeaf is a mobile application developed to help users identify
            selected medicinal plants and access educational information about
            their characteristics, potential benefits, and traditional
            preparation methods.
          </Section>

          <Section title="2. Purpose of the Application">
            MedicLeaf is intended for educational and informational purposes.
            Its features include medicinal plant leaf identification, a Plant
            Library, Scan History, and Resource Sharing with Location Pin
            Pointing.
            {"\n\n"}
            The application is designed to help users learn about selected
            medicinal plants. It is not intended to replace professional
            medical advice, diagnosis, or treatment.
          </Section>

          <Section title="3. Plant Identification Disclaimer">
            MedicLeaf uses an on-device machine learning model to identify
            supported medicinal plant leaves from images submitted by users.
            Depending on the application's implementation, an online
            identification service may also be used as an additional
            verification or fallback mechanism.
            {"\n\n"}
            Plant identification results may be inaccurate or incomplete
            because of image quality, lighting conditions, leaf similarities,
            model limitations, or other factors.
            {"\n\n"}
            Users should not rely solely on the application's identification
            results to determine whether a plant is safe for consumption,
            preparation, or medicinal use. Always verify plant identification
            with a qualified expert before using an unfamiliar plant.
          </Section>

          <Section title="4. Medical and Health Disclaimer">
            Information about medicinal plants, including their potential
            benefits, preparation methods, traditional uses, and precautions,
            is provided for general educational purposes only.
            {"\n\n"}
            MedicLeaf does not provide medical diagnoses, prescribe medicines,
            or guarantee that any medicinal plant will prevent, treat, or cure
            a disease.
            {"\n\n"}
            The safety and effectiveness of medicinal plants may vary
            depending on the plant species, preparation, dosage, individual
            health conditions, and possible interactions with medications.
            {"\n\n"}
            Consult a qualified healthcare professional before using medicinal
            plants for health purposes. Do not delay or discontinue prescribed
            treatment based on information obtained from the application.
          </Section>

          <Section title="5. User Responsibilities">
            By using MedicLeaf, you agree to:
            {"\n\n"}
            Use the application responsibly and for lawful purposes.
            {"\n"}
            Submit images and other content that you have the right to use.
            {"\n"}
            Provide accurate information when creating posts or sharing
            locations.
            {"\n"}
            Avoid uploading misleading, harmful, abusive, or unlawful content.
            {"\n"}
            Avoid using the application to promote unsafe medicinal practices
            or make unsupported medical claims.
            {"\n"}
            Respect the privacy and rights of other users.
            {"\n"}
            Verify important plant identification and health-related
            information before acting on it.
            {"\n\n"}
            You are responsible for how you interpret and use the information
            provided by the application.
          </Section>

          <Section title="6. User Accounts and Guest Access">
            MedicLeaf may provide account registration, login, and guest
            access, depending on the available application features.
            {"\n\n"}
            Users who create accounts are responsible for maintaining the
            confidentiality of their login credentials and for activities
            performed through their accounts.
            {"\n\n"}
            Guest users may have limited access to certain features. Features
            that require an authenticated account may not be available until
            the user registers or logs in.
            {"\n\n"}
            MedicLeaf may restrict access to accounts involved in misuse,
            abuse, or violations of these terms, subject to applicable
            requirements.
          </Section>

          <Section title="7. Scan History and Plant Library">
            The Plant Library provides stored educational information about
            selected medicinal plants. The Scan Feature processes images to
            generate plant identification results.
            {"\n\n"}
            Scan History may allow users to review previously saved
            identification results. Only scans successfully saved through the
            relevant feature may appear in the user's history.
            {"\n\n"}
            The availability of saved records may depend on the application's
            storage implementation, device condition, and account status.
          </Section>

          <Section title="8. Resource Sharing and Location Pin Pointing">
            MedicLeaf may allow users to share plant-related resources, posts,
            and location pins with other users.
            {"\n\n"}
            Users are responsible for the accuracy and appropriateness of the
            information and locations they submit. A shared location should
            not be assumed to confirm the identity, availability, ownership,
            safety, or medicinal suitability of a plant at that location.
            {"\n\n"}
            Do not share private addresses, sensitive personal information, or
            another person's location without appropriate permission.
            {"\n\n"}
            Users should exercise caution when visiting locations shared by
            others. MedicLeaf does not guarantee the accuracy or safety of
            user-submitted locations.
          </Section>

          <Section title="9. Direct Messaging and User Conduct">
            If direct messaging is available, users must communicate
            respectfully and must not use the feature to harass, threaten,
            defraud, impersonate, or exploit others.
            {"\n\n"}
            Users must not send unlawful content, malicious links, or
            unsolicited messages intended to harm other users.
            {"\n\n"}
            MedicLeaf may investigate reported misuse and restrict access to
            features when reasonably necessary, subject to applicable law and
            available moderation capabilities.
          </Section>

          <Section title="10. Privacy and Data Handling">
            MedicLeaf may process information necessary to operate its
            features, such as account details, user-submitted content, saved
            scan records, recent searches, and shared location information,
            depending on the features used.
            {"\n\n"}
            Plant identification models and plant information stored locally
            may operate directly on the device. However, online features may
            require an internet connection and may transmit relevant
            information to external services.
            {"\n\n"}
            Users should review the application's Privacy Policy for details
            about information collected, how it is used, where it is stored,
            and how it may be shared.
            {"\n\n"}
            MedicLeaf should handle personal information in accordance with
            its actual data practices and applicable privacy laws, including
            the Philippine Data Privacy Act of 2012 (Republic Act No.
            10173), where applicable.
          </Section>

          <Section title="11. Third-Party Services and Internet Connectivity">
            Certain features may depend on third-party services, including
            authentication providers, online identification services, or
            location-related services.
            {"\n\n"}
            These services may have separate terms, privacy policies,
            availability requirements, and limitations.
            {"\n\n"}
            The on-device plant identification feature may operate without
            internet connectivity, but online verification, authentication,
            messaging, location-related functions, and other
            network-dependent features may require an active connection.
            {"\n\n"}
            MedicLeaf does not guarantee uninterrupted availability of
            third-party services or network-dependent features.
          </Section>

          <Section title="12. Intellectual Property">
            The MedicLeaf application, including its original interface,
            design, code, and other original materials, is protected by
            applicable intellectual property laws.
            {"\n\n"}
            Users may not copy, modify, distribute, or commercially exploit
            protected application materials without appropriate
            authorization, except as permitted by law.
            {"\n\n"}
            Plant information, datasets, images, machine learning models, and
            third-party materials may be subject to separate licenses,
            attribution requirements, or usage restrictions.
          </Section>

          <Section title="13. Application Availability and Limitations">
            MedicLeaf is provided on an as-available basis. The application
            may contain errors, incomplete information, identification
            inaccuracies, or temporary interruptions.
            {"\n\n"}
            The developers may update, modify, suspend, or discontinue
            features when necessary for maintenance, improvement, security, or
            other legitimate purposes.
            {"\n\n"}
            Users are encouraged to keep the application updated and to
            maintain appropriate backups of important information when the
            relevant features permit it.
          </Section>

          <Section title="14. Limitation of Liability">
            To the extent permitted by applicable law, MedicLeaf and its
            developers shall not be responsible for losses or damages arising
            from reliance on inaccurate plant identification, incomplete
            educational information, user-submitted content, or unavailable
            third-party services.
            {"\n\n"}
            Nothing in these terms excludes or limits liability where such
            exclusion or limitation is prohibited by applicable law.
            {"\n\n"}
            Users remain responsible for verifying plant identification,
            seeking appropriate professional advice, and exercising reasonable
            caution when using information obtained from the application.
          </Section>

          <Section title="15. Changes to These Terms">
            MedicLeaf may revise these Terms and Conditions to reflect changes
            in application features, operational requirements, or applicable
            laws.
            {"\n\n"}
            Updated terms should indicate the revised effective date.
            Continued use of the application after updated terms take effect
            may constitute acceptance where permitted by applicable law.
          </Section>

          <Section title="16. Termination of Use">
            Users may stop using MedicLeaf at any time. Access to certain
            features may be suspended or terminated for violations of these
            terms or misuse of the application, subject to applicable law.
            {"\n\n"}
            Where account deletion is supported, users may follow the
            available account deletion process. The handling and retention of
            associated personal information will be governed by the Privacy
            Policy and applicable legal requirements.
          </Section>

          <Section title="17. Contact Information">
            For questions, concerns, or reports regarding these Terms and
            Conditions, users may contact the MedicLeaf development team
            through the official contact information provided within the
            application.
          </Section>

          <Text className="text-sm mt-5 leading-5" style={{ color: "#374151" }}>
            By continuing to use MedicLeaf, you acknowledge that you have read
            and understood these Terms and Conditions.
          </Text>

          {/* Document 2 — Privacy Policy (referenced by Terms §10) */}
          <View
            style={{
              height: 1,
              backgroundColor: "#B7E4C7",
              marginTop: 28,
              marginBottom: 4,
            }}
          />
          <Text
            className="text-base font-bold mt-3"
            style={{ color: "#1B4332", textAlign: "center" }}
          >
            PRIVACY POLICY
          </Text>
          <Text className="text-xs mt-1" style={{ color: "#6b7280" }}>
            Last updated: October 13, 2026
          </Text>

          <Section title="1. Account Information">
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

          <Section title="2. Location Data">
            Posts in the App can carry a location. When you create a post,
            the App attaches the location of the photo itself: for photos
            you take with the camera, that is the location recorded with
            the photo (or your location at the moment you took it); for
            photos chosen from your gallery, the location recorded in the
            photo, if it has one. A photo without a location can still be
            posted — the post is simply shared without one, and you may
            place a pin on the map yourself when creating or editing your
            post. Your location permission is requested only for this
            purpose (the App may offer to turn it on so a scan keeps its
            spot, and you may decline), and the App does not track your
            location in the background or share your live position with
            anyone.
            {"\n\n"}
            A post's location (its coordinates and a street-level address
            derived from them) becomes visible to other users on the
            Community feed and on the Map. The Map is view-only: it shows
            where posts were made and never shows where you are.
          </Section>

          <Section title="3. Data We Collect">
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

          <Section title="4. How We Use Your Data">
            Your data is used to operate core App features: identifying
            plants, saving your scan history, displaying your posts and
            profile to other users, enabling messaging and the community
            map, and keeping you signed in securely. We do not sell your
            personal data to third parties and do not use it for
            advertising.
          </Section>

          <Section title="5. Third-Party Services">
            The App uses third-party services to operate: Supabase
            (accounts, database, and server functions), Cloudinary (photo
            and image hosting), Geoapify (map tiles, converting a post's
            coordinates into a readable address, and drawing walking routes
            on the map), and Google Sign-In (alternative sign-in). These
            providers process data on our behalf under their own privacy
            and security practices.
          </Section>

          <Section title="6. Guest Mode">
            You may use the plant scanner and the plant library without
            creating an account. Guest activity stays on your device and is
            not linked to a persistent identity. Scan history, community
            posting, the map, and messaging require a full account.
          </Section>

          <Section title="7. Account Deletion">
            You may delete your account at any time from Delete Account in
            your profile. This permanently erases your profile information,
            scan history, posts and your interactions with other users, and
            app settings and preferences, and removes the credentials saved
            by "Remember me" from your device. This action is permanent and
            cannot be undone.
          </Section>

          <Section title="8. Changes to This Privacy Policy">
            We may update this Privacy Policy from time to time. Continued
            use of the App after changes constitutes acceptance of the
            updated policy.
          </Section>

          <Section title="9. Contact Us">
            If you have questions about this Privacy Policy or your data,
            contact the MedicLeaf development team through the official
            contact information provided within the application.
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
