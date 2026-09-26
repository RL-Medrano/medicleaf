import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  size?: number;
  strokeWidth?: number;
  darkColor?: string;
  lightColor?: string;
  duration?: number;
};

export default function RingLoader({
  size = 48,
  strokeWidth = 5,
  darkColor = "#2F6B4A",
  lightColor = "#5BE8A8",
  duration = 1000,
}: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, duration]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r; // circumference
  const center = size / 2;
  const origin = `${center}, ${center}`;

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size}>
        {/* Dark green arc (~220°) */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={darkColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * 0.61} ${c}`}
          rotation={100}
          origin={origin}
        />
        {/* Mint arc (~60°) */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={lightColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * 0.17} ${c}`}
          rotation={15}
          origin={origin}
        />
      </Svg>
    </Animated.View>
  );
}