/**
 * components/Skel.tsx
 *
 * Shared building blocks for the loading skeletons (Home, Profile, …):
 * the placeholder colours from the mockups, a green block (`Skel`), and a
 * gentle pulse hook so "still loading" reads clearly on screen.
 */
import React, { useEffect, useRef } from "react";
import { Animated, View, type DimensionValue, type ViewStyle } from "react-native";

/** Bright green placeholder blocks (from the mockups). */
export const SKELETON_COLOR = "#7EE07E";
/** Moss ring behind the Profile avatar skeleton (from the mockup). */
export const SKELETON_RING = "#7E9E68";

/**
 * Green placeholder block. `w` accepts pixels or a percentage ("72%");
 * `style` applies last so callers can override the default fully-rounded
 * corners (e.g. the image squares) or the colour.
 */
export function Skel({
  w,
  h = 14,
  style,
}: {
  w: DimensionValue;
  h?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { width: w, height: h, borderRadius: h / 2, backgroundColor: SKELETON_COLOR },
        style,
      ]}
    />
  );
}

/**
 * Gentle opacity pulse (1 → 0.45 → 1, 700 ms each) for skeleton blocks.
 * Animates only while `active` — pass your loading flag.
 */
export function useSkeletonPulse(active: boolean): Animated.Value {
  const value = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, value]);

  return value;
}
