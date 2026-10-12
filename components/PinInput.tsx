import React, { useState } from "react";
import { View, Text, Image, TextInput, Pressable } from "react-native";

/**
 * 6-digit PIN field used by the create / verify / reset PIN screens.
 * Digits only, masked by default, with the same eye toggle as the app's
 * password fields.
 */
export function PinInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (pin: string) => void;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-5">
      {!!label && (
        <Text className="font-bold mb-1" style={{ color: "#1B4332" }}>
          {label}
        </Text>
      )}
      <View
        className="rounded-xl px-4 py-3.5 flex-row items-center justify-between"
        style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" }}
      >
        <TextInput
          // Strip anything that isn't a digit the moment it's typed, so a
          // pasted phone number or stray space can't reach the PIN check.
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
          placeholder="000000"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry={!visible}
          className="flex-1 text-center text-2xl tracking-widest"
          style={{ color: "#1B4332", padding: 0 }}
        />
        <Pressable onPress={() => setVisible(!visible)} hitSlop={10} className="ml-3">
          <Image
            source={
              visible
                ? require("@/assets/images/icons/eye_on.png")
                : require("@/assets/images/icons/eye_off.png")
            }
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </View>
  );
}
