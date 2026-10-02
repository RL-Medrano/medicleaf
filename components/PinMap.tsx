/**
 * components/PinMap.tsx
 *
 * Shared "drop a pin" map for Create Post and Edit Post.
 *
 *   • Single tap → drops / moves the pin.
 *   • Double tap → opens the map full screen so the user can look around
 *     before choosing a spot. The X button at the top-right closes it
 *     (the Android back button does too — see onRequestClose below).
 *
 * Why the double tap needs react-native-gesture-handler:
 * MapLibre's Android build dispatches `onPress` from
 * GestureDetector#onSingleTapConfirmed, which by design does NOT fire when
 * the taps turn out to be part of a double tap — so a double tap on the map
 * never reaches JS. An independent 2-tap recognizer does see it, and
 * `doubleTapZoom={false}` stops the map from zooming at the same moment.
 *
 * The pin itself is a plain View (not an image) rendered through
 * ViewAnnotation, keyed on the coordinates: on Android a ViewAnnotation
 * rasterizes its children into a bitmap and does not redraw them in place,
 * so the key has to change whenever the pin moves — otherwise the marker
 * either never shows up or stays stuck on the old spot.
 */
import React, { useMemo, useState } from "react";
import {
  View,
  Image,
  Pressable,
  Modal,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Map,
  Camera,
  ViewAnnotation,
  RasterSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getGeoapifyTileUrlTemplate } from "@/utils/geoapify";

export type MapCoord = { latitude: number; longitude: number };

// Blank base style — only our own Geoapify raster layer is drawn on top.
const BLANK_MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [],
};

// Fallback centre until a pin exists — Lipa City, Batangas.
export const DEFAULT_MAP_CENTER: [number, number] = [121.1631, 13.9411];

const CLOSE_ICON = require("../assets/images/icons/close.png");

type PinMapProps = {
  /** Current pin, or null when there isn't one yet. */
  coord: MapCoord | null;
  /** Called with the tapped coordinate (single taps only). */
  onPinChange: (coord: MapCoord) => void;
  /** Camera zoom, used by both the inline and the full-screen map. */
  zoom: number;
  /** Height of the inline (in-form) map. */
  height?: number;
  /** Corner radius of the inline map. */
  borderRadius?: number;
  /** Hide the marker (e.g. Pin Location switched off). */
  showPin?: boolean;
  /** Ignore taps (e.g. Pin Location switched off). */
  disabled?: boolean;
  /** Extra element drawn over the inline map (e.g. the locating spinner). */
  overlay?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function PinMap({
  coord,
  onPinChange,
  zoom,
  height = 170,
  borderRadius = 16,
  showPin = true,
  disabled = false,
  overlay,
  style,
}: PinMapProps) {
  const [expanded, setExpanded] = useState(false);

  // Two taps = open full screen. maxDelay matches Android's double-tap
  // timeout so this window lines up with the one MapLibre uses internally.
  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(300)
        .maxDuration(800)
        // With reanimated/worklets installed, RNGH runs handlers on the UI
        // runtime by default. React state may only be set from the JS
        // thread, so force this callback back onto it (otherwise:
        // "Tried to synchronously call a Remote Function ... dispatchSetState
        // on the UI Runtime").
        .runOnJS(true)
        .onEnd((_event, success) => {
          if (success) setExpanded(true);
        }),
    []
  );

  // Centered on the pin once there is one, otherwise on the fallback.
  const center: [number, number] = coord
    ? [coord.longitude, coord.latitude]
    : DEFAULT_MAP_CENTER;

  function handlePress(event: any) {
    if (disabled) return;
    // MapLibre v11 events use the NativeSyntheticEvent pattern — the payload
    // lives in event.nativeEvent and coordinates are [longitude, latitude].
    const [longitude, latitude] = event.nativeEvent.lngLat;
    onPinChange({ latitude, longitude });
  }

  function renderMap(androidView: "surface" | "texture") {
    return (
      <GestureDetector gesture={doubleTap}>
        <View style={{ flex: 1 }}>
          <Map
            style={{ flex: 1 }}
            mapStyle={BLANK_MAP_STYLE}
            onPress={handlePress}
            // Our 2-tap gesture owns double-tap; stop the map zooming too.
            doubleTapZoom={false}
            androidView={androidView}
          >
            <Camera center={center} zoom={zoom} />

            <RasterSource
              id="geoapifySource"
              tiles={[getGeoapifyTileUrlTemplate()]}
              tileSize={256}
            >
              <Layer id="geoapifyLayer" type="raster" source="geoapifySource" />
            </RasterSource>

            {showPin && coord && (
              <ViewAnnotation
                // Key changes with the coordinates — see the note at the top
                // of this file (Android rasterizes the annotation once).
                key={`pin-${coord.latitude}-${coord.longitude}`}
                id="pin"
                lngLat={[coord.longitude, coord.latitude]}
              >
                <View style={styles.dot} />
              </ViewAnnotation>
            )}
          </Map>
        </View>
      </GestureDetector>
    );
  }

  return (
    <>
      <View style={[{ height, borderRadius, overflow: "hidden" }, style]}>
        {!expanded && renderMap("surface")}
        {overlay}
      </View>

      <Modal
        visible={expanded}
        animationType="fade"
        // Android hardware back closes the full-screen map first.
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.fullscreen}>
          {/* TextureView: a SurfaceView does not render reliably inside the
              dialog window that Android's Modal opens. */}
          {renderMap("texture")}

          <SafeAreaView
            edges={["top"]}
            pointerEvents="box-none"
            style={styles.closeBar}
          >
            <Pressable
              onPress={() => setExpanded(false)}
              hitSlop={12}
              style={styles.closeButton}
            >
              <Image source={CLOSE_ICON} style={styles.closeIcon} resizeMode="contain" />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Same marker as the Medicinal Plant Map.
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1B4332",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  fullscreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  closeBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
});
