/**
 * app/tab/map.tsx
 *
 * Shows all posts that have a location pinned, as markers on a MapLibre
 * map. Tapping a pin shows a bottom card with the plant + poster info.
 * "Get Directions" computes a real walking route from the user's current
 * location to that pin via Geoapify's Routing API (used only to draw the
 * line), then switches to a LIVE, speed-based ETA: as the person actually
 * moves, we watch their GPS speed and recompute "time remaining" and
 * "arrive at" ourselves, rather than relying on a fixed walking-speed
 * assumption from the routing API.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Map,
  Camera,
  ViewAnnotation,
  RasterSource,
  Layer,
  GeoJSONSource,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { getAuthState } from "@/utils/guest";
import { checkIsOnline } from "@/utils/network";
import { getGeoapifyTileUrlTemplate, getWalkingRoute } from "@/utils/geoapify";
import { GuestPrompt } from "@/components/GuestPrompt";
import { getPlantDetailsBySlug } from "@/utils/plantClassifier";

const RECENT_SEARCHES_KEY = "map_recent_plant_searches";
const MAX_RECENT_SEARCHES = 5;

const BLANK_MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [],
};

// Used only as a fallback when GPS speed is missing or unreliable (e.g.
// the person hasn't started moving yet, or the reading is noisy/near
// zero). Roughly an average walking pace in m/s.
const FALLBACK_SPEED_MPS = 1.4;

// Below this, a speed reading is treated as "not moving yet" rather than
// an actual pace, so we fall back to FALLBACK_SPEED_MPS instead of
// dividing by a near-zero number.
const MIN_RELIABLE_SPEED_MPS = 0.3;

type PinnedPost = {
  id: string;
  name: string;
  // Same slug the original scan was saved with (see scanresult.tsx /
  // createpost.tsx) — used to look up scientific_name locally from
  // plant_info.json, the same way scanresult.tsx already does. Requires
  // a plant_slug column on posts; see createpost.tsx's header comment.
  plant_slug: string | null;
  image_url: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  user_id: string;
  profiles: { username: string } | null;
};

type Coordinates = { latitude: number; longitude: number };

// Straight-line distance, used for the live ETA recalculation. The drawn
// route line still comes from Geoapify's actual path, but the ETA is
// re-derived from the person's live position and speed rather than that
// fixed route estimate.
function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // Earth radius, meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function MapScreen() {
  // Set when arriving from viewpost.tsx or community.tsx via the pin
  // icon (they navigate to /tab/map with { postId }). Once `posts` has
  // loaded, we look up this id, auto-select that pin (opening the
  // bottom card) and recenter the camera on it.
  const { postId } = useLocalSearchParams<{ postId?: string }>();

  const [posts, setPosts] = useState<PinnedPost[]>([]);
  const [plantNames, setPlantNames] = useState<string[]>([]);
  // Chips are the person's own recent-search history, not derived from
  // which plants happen to have pins on the map — a pinned plant the
  // person has never searched for gets no chip. Multi-select: any
  // number of specific plant chips can be active at once. Empty array
  // falls back to showing everything — see visiblePosts below.
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<PinnedPost | null>(null);
  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null); // m/s, from GPS

  // Route geometry for the drawn line only — its own duration/distance
  // fields are NOT used for display; the ETA shown to the person is the
  // live, speed-based one computed separately below.
  const [routeGeometry, setRouteGeometry] = useState<any | null>(null);
  const [routing, setRouting] = useState(false);

  // Live ETA, recalculated continuously while a route is active.
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [arrivalLabel, setArrivalLabel] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Camera recenters reactively when this changes (e.g. on search match).
  const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);

  // Auto-follow, but only meaningful while a route is active (that's the
  // only time the camera keeps moving on its own via GPS watch). True by
  // default; a manual pan/gesture during navigation flips it to false so
  // we stop fighting the person's own panning. The small "Recenter"
  // button (shown only in that state) flips it back to true.
  const [followingUser, setFollowingUser] = useState(true);
  // The center to actually feed the <Camera> while auto-follow is off —
  // frozen at whatever it was when the person started panning, so we
  // don't keep passing new center values that would re-trigger a fly-to.
  const [frozenCenter, setFrozenCenter] = useState<[number, number] | null>(null);

  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  // Timestamp of the last pin press — lets handleMapPress tell a genuine
  // empty-map tap apart from the map press some platforms also fire for
  // a tap that landed on a pin.
  const lastPinPressRef = useRef(0);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Android hardware/gesture back closes search mode instead of leaving
  // the screen, whenever search is open — per the "exit search without
  // selecting" behavior (map tap, back button, or edge-swipe should all
  // just dismiss the overlay and discard the typed text).
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (searchOpen) {
        closeSearchDiscard();
        return true; // handled — don't also navigate back
      }
      return false; // let default back behavior happen
    });
    return () => subscription.remove();
  }, [searchOpen]);

  useFocusEffect(
    useCallback(() => {
      checkGuestThenLoad();
      loadMyLocation();

      // Stop any live GPS watch if the person navigates away from this
      // screen while a route was active, so it doesn't keep running (and
      // draining battery) in the background.
      return () => {
        stopWatchingLocation();
      };
    }, [])
  );

  async function checkGuestThenLoad() {
    // getAuthState() also recognises a local guest (no session at all)
    // and keeps a signed-in member recognised while offline, which
    // getUser() alone would not — it asks the server and returns no user
    // in both of those cases.
    const { user, isGuest: guest } = await getAuthState();
    setIsGuest(guest);

    if (guest || !user) {
      // Same RLS restriction as Community Feed — guests can't read posts.
      setLoading(false);
      return;
    }

    loadPinnedPosts();
  }

  async function loadPinnedPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, name, plant_slug, image_url, location_name, latitude, longitude, user_id, profiles(username)"
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      // Don't leave the map silently empty with no clue why (e.g. offline,
      // or a broken profiles(username) join).
      console.error("[map] failed to load pinned posts:", error.message);
    } else if (data) {
      const pinned = data as unknown as PinnedPost[];
      setPosts(pinned);
      setPlantNames(Array.from(new Set(pinned.map((p) => p.name))));
    }

    setLoading(false);
  }

  async function loadMyLocation() {
    // Called straight from useFocusEffect, so any rejection here surfaces as
    // an unhandled promise rejection ("Current location is unavailable...").
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;

      // Distinguish "location services are off" (device/emulator toggle)
      // from a permission problem, and tell the person what to do instead
      // of failing silently inside getCurrentPositionAsync.
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location is turned off",
          "Turn on location services to show your position and get walking directions."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setMyLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err) {
      // Map still works without a blue dot — pins and search don't need it.
      console.error("[map] failed to read current location:", err);
    }
  }

  // If we arrived here with a specific postId (from viewpost.tsx or
  // community.tsx's pin icon), open that pin's bottom card and center
  // the map on it as soon as the post list has loaded. If that post
  // isn't in the loaded list (e.g. it has no location, or was deleted),
  // this simply does nothing rather than erroring.
  useEffect(() => {
    if (!postId || posts.length === 0) return;

    const target = posts.find((p) => p.id === postId);
    if (target) {
      setSelectedPost(target);
      setCameraCenter([target.longitude, target.latitude]);
    }
  }, [postId, posts]);

  function handleSelectPin(post: PinnedPost) {
    lastPinPressRef.current = Date.now();

    // Pressing the already-selected pin toggles it back off — same
    // result as tapping anywhere else on the map.
    if (selectedPost?.id === post.id) {
      setSelectedPost(null);
      clearRoute();
      return;
    }

    setSelectedPost(post);
    clearRoute(); // clear any previous route + stop watching when switching pins
  }

  // Tapping anywhere on the map that isn't a pin dismisses the active
  // pin: the card closes and the pin returns to plain dark green.
  function handleMapPress() {
    // Ignore presses that happen right after a pin was selected — some
    // platforms fire the map's press for the same tap that hit a pin,
    // which would close the card the instant it opens.
    if (Date.now() - lastPinPressRef.current < 350) return;
    if (!selectedPost) return;
    setSelectedPost(null);
    clearRoute();
  }

  function stopWatchingLocation() {
    watchSubscriptionRef.current?.remove();
    watchSubscriptionRef.current = null;
  }

  function clearRoute() {
    setRouteGeometry(null);
    setEtaMinutes(null);
    setArrivalLabel(null);
    setFollowingUser(true);
    setFrozenCenter(null);
    stopWatchingLocation();
  }

  // Recomputes the live ETA from wherever the person currently is, using
  // their real GPS speed when it's reliable, or a fallback walking pace
  // when it isn't (e.g. speed reads 0 or null because they haven't
  // started moving yet).
  function recomputeEta(fromLocation: Coordinates, speedMps: number | null, destination: PinnedPost) {
    const distance = haversineMeters(fromLocation, {
      latitude: destination.latitude,
      longitude: destination.longitude,
    });

    const speed =
      speedMps !== null && speedMps >= MIN_RELIABLE_SPEED_MPS
        ? speedMps
        : FALLBACK_SPEED_MPS;

    const seconds = distance / speed;
    const minutes = Math.max(1, Math.round(seconds / 60));

    setEtaMinutes(minutes);
    setArrivalLabel(
      new Date(Date.now() + seconds * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }

  async function handleGetDirections() {
    if (!selectedPost) return;

    if (!myLocation) {
      Alert.alert(
        "Location needed",
        "Turn on location access to get walking directions."
      );
      return;
    }

    const online = await checkIsOnline();
    if (!online) {
      Alert.alert("You're offline", "Connect to the internet to get walking directions.");
      return;
    }

    setRouting(true);
    setFollowingUser(true);
    setFrozenCenter(null);
    try {
      // Used only to draw the path on the map — its own ETA fields are
      // discarded in favor of the live, speed-based calculation below.
      const result = await getWalkingRoute(
        myLocation.latitude,
        myLocation.longitude,
        selectedPost.latitude,
        selectedPost.longitude
      );
      setRouteGeometry(result.geometry);

      // Seed the ETA immediately using whatever we currently know, then
      // start watching position/speed so it keeps updating live.
      recomputeEta(myLocation, currentSpeed, selectedPost);

      stopWatchingLocation();
      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (position) => {
          const nextLocation: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const speed = position.coords.speed; // m/s, may be null/negative when unreliable
          const normalizedSpeed = speed !== null && speed >= 0 ? speed : null;

          setMyLocation(nextLocation);
          setCurrentSpeed(normalizedSpeed);
          recomputeEta(nextLocation, normalizedSpeed, selectedPost);
        }
      );
    } catch (err) {
      console.error("[map] routing failed:", err);
      Alert.alert("Couldn't get directions", "Please try again.");
    } finally {
      setRouting(false);
    }
  }

  function handleCancelRoute() {
    clearRoute();
  }

  async function loadRecentSearches() {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (err) {
      console.error("[map] failed to load recent searches:", err);
    }
  }

  async function saveRecentSearches(next: string[]) {
    setRecentSearches(next);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("[map] failed to save recent searches:", err);
    }
  }

  function openSearch() {
    setSearchOpen(true);
    setSearchQuery("");
  }

  // Exit search without picking anything — typed text is discarded, the
  // map/chip filter stay exactly as they were before search was opened.
  // Triggered by: tapping the map, the hardware/gesture back action, or
  // (not handled here — it's just the OS switching screens) an edge
  // swipe that navigates away from this tab entirely.
  function closeSearchDiscard() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  // Committing a search — either by tapping a recent-search row or
  // submitting typed text that matches a known plant — selects that
  // plant's chip (added to the active set, existing selections kept),
  // recenters on the first matching pin, closes search, and remembers
  // this as a recent search (most-recent-first, deduped, capped).
  function commitSearch(name: string) {
    setActiveFilters((prev) => (prev.includes(name) ? prev : [...prev, name]));

    const match = posts.find((p) => p.name === name);
    if (match) {
      setCameraCenter([match.longitude, match.latitude]);
    }

    const deduped = recentSearches.filter((s) => s !== name);
    saveRecentSearches([name, ...deduped].slice(0, MAX_RECENT_SEARCHES));

    setSearchOpen(false);
    setSearchQuery("");
  }

  // Chips are a multi-select toggle: tapping one adds/removes it from
  // activeFilters. Deselecting a chip only affects filtering — it does
  // NOT remove it from recent-search history; that's a separate action
  // (the X button, see handleDeleteRecentSearch).
  function toggleFilterChip(name: string) {
    setActiveFilters((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  // The X on a recent-search chip/row — permanently removes it from
  // history (and, since the chip disappears, from the active filter set
  // too, so there's nothing left referencing a name with no chip).
  function handleDeleteRecentSearch(name: string) {
    saveRecentSearches(recentSearches.filter((s) => s !== name));
    setActiveFilters((prev) => prev.filter((n) => n !== name));
  }

  // Used for the return-key/submit case, where the person typed a full
  // name rather than tapping a suggestion — matched case-insensitively
  // against known plant names (built from posts that actually have a
  // pin, not a fixed plant list). A typo or any plant name with no
  // pinned locations falls into the "no match" case below.
  function handleSearchSubmit() {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const match = plantNames.find((name) => name.toLowerCase() === query);
    if (match) {
      commitSearch(match);
    } else {
      Alert.alert(
        "No location found",
        `No pinned location was found for "${searchQuery.trim()}".`
      );
    }
  }

  // The recent-searches list, narrowed by whatever's currently typed
  // (or the full recent list when the field is empty).
  const filteredRecentSearches = searchQuery.trim()
    ? recentSearches.filter((name) =>
        name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : recentSearches;

  // No chip active means "show everything" — a specific chip being
  // active/inactive only narrows the view down when it's the only
  // kind of filter present.
  const showAllPlants = activeFilters.length === 0;
  const visiblePosts = showAllPlants
    ? posts
    : posts.filter((p) => activeFilters.includes(p.name));

  const liveCenter: [number, number] =
    cameraCenter ??
    (myLocation
      ? [myLocation.longitude, myLocation.latitude]
      : posts.length > 0
      ? [posts[0].longitude, posts[0].latitude]
      : [121.1631, 13.9411]); // fallback: Lipa City

  const hasActiveRoute = routeGeometry !== null;

  // While a route is active and the person has manually panned, keep
  // feeding the SAME frozen value to <Camera> so it has nothing new to
  // fly to — this is what actually stops the fight between GPS updates
  // and manual panning. Outside of that state (browsing, or still
  // following), just use the normal live center.
  const cameraCenterToUse: [number, number] =
    hasActiveRoute && !followingUser && frozenCenter ? frozenCenter : liveCenter;

  // Called from the Map's region-change event. MapLibre reports whether
  // a region change came from a user gesture vs. a programmatic camera
  // move — check this against your installed version's actual event
  // payload shape, since the exact property name can vary by release
  // (commonly `isUserInteraction` on the event or its properties).
  function handleRegionWillChange(event: any) {
    if (!hasActiveRoute || !followingUser) return;

    const isUserGesture =
      event?.nativeEvent?.isUserInteraction ??
      event?.nativeEvent?.properties?.isUserInteraction ??
      event?.properties?.isUserInteraction;

    if (isUserGesture) {
      setFrozenCenter(liveCenter);
      setFollowingUser(false);
    }
  }

  function handleRecenter() {
    setFollowingUser(true);
    setFrozenCenter(null);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#D8F3DC" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#D8F3DC" />

      {/* White header band — the mockup shows white directly below the
          green status-bar strip in every state (plain header, chips row,
          and the open search list); only the strip itself stays green. */}
      <View style={{ backgroundColor: "#FFFFFF" }}>
        <View
          className="flex-row items-center justify-center px-5"
          style={{
            paddingTop: 16,
            paddingBottom:
              searchOpen || (!isGuest && recentSearches.length > 0) ? 10 : 16,
          }}
        >
          {searchOpen ? (
            <>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                placeholder="Search medicinal plant"
                placeholderTextColor="#6B7280"
                autoFocus
                style={{ flex: 1, color: "#1B4332", fontSize: 16 }}
              />
              <Image
                source={require("@/assets/images/icons/search.png")}
                style={{ width: 40, height: 40, marginLeft: 12 }}
                resizeMode="contain"
              />
            </>
          ) : (
            <>
              <Text className="text-xl font-bold flex-1 text-center" style={{ color: "#000000" }}>
                Medicinal Plant Map
              </Text>
              {!isGuest && (
                <Pressable onPress={openSearch} hitSlop={10} style={{ position: "absolute", right: 20 }}>
                  <Image
                    source={require("@/assets/images/icons/search.png")}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            </>
          )}
        </View>

        {searchOpen ? (
          // Recent-searches list — only past searches, not a live filter
          // of every plant. Empty when there's no history yet, per spec:
          // nothing renders rather than a placeholder. The divider under
          // the field is full-width, like the mockup.
          <>
            <View style={{ height: 1, backgroundColor: "#E5E7EB" }} />
            {filteredRecentSearches.map((name) => (
              <View
                key={name}
                className="px-5 py-3 flex-row items-center justify-between"
                style={{ borderBottomWidth: 1, borderColor: "#E5E7EB" }}
              >
                <Pressable onPress={() => commitSearch(name)} style={{ flex: 1 }}>
                  <Text style={{ color: "#000000", fontSize: 16 }}>{name}</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteRecentSearch(name)} hitSlop={10}>
                  <Text style={{ color: "#6b7280", fontSize: 15 }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : (
          /* Filter chips — built from the person's own recent-search
             history, not from which plants happen to have pins on the
             map. Hidden entirely until at least one search has been made.
             Mockup chips are plain pills (no ✕); deletion happens from
             the search list above. No "All Plants" chip — per mockup it
             was static design, not a filter that appears when searching. */
          !isGuest &&
          recentSearches.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5"
              style={{ paddingBottom: 12 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {recentSearches.map((name) => {
                const isActive = activeFilters.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggleFilterChip(name)}
                    className="rounded-full"
                    style={{
                      backgroundColor: isActive ? "#1B4332" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isActive ? "#1B4332" : "#D1D5DB",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: isActive ? "#FFFFFF" : "#000000" }}>{name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )
        )}
      </View>

      {isGuest ? (
        <GuestPrompt message="Create or Log in your account to see others pinned location of Medicinal Plant Leaves" />
      ) : (
        <>

          {/* Map — sits flush against the white header band; the mockup
               shows no page-green strip between them (green only appears
               at the very top as the status-bar area). */}
          <View className="flex-1" style={{ position: "relative" }}>
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#1B4332" />
              </View>
            ) : (
              <Map
                style={{ flex: 1 }}
                mapStyle={BLANK_MAP_STYLE}
                onRegionWillChange={handleRegionWillChange}
                onPress={handleMapPress}
              >
                <Camera center={cameraCenterToUse} zoom={14} />

                <RasterSource
                  id="geoapifySource"
                  tiles={[getGeoapifyTileUrlTemplate()]}
                  tileSize={256}
                >
                  <Layer id="geoapifyLayer" type="raster" source="geoapifySource" />
                </RasterSource>

                {/* My location — always blue, always with a white
                    background/border. This does not change when a route
                    becomes active; only the plant pin's selection state
                    changes elsewhere. */}
                {myLocation && (
                  <ViewAnnotation
                    id="myLocation"
                    lngLat={[myLocation.longitude, myLocation.latitude]}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: "#3B82F6",
                        borderWidth: 2,
                        borderColor: "#FFFFFF",
                      }}
                    />
                  </ViewAnnotation>
                )}

                {/* Plant pins — plain dark green (#1B4332) at rest; the
                    selected pin inverts to a WHITE background with a
                    dark-green ring, and stays that way through an active
                    route too. Tapping the map clears the selection (see
                    handleMapPress). */}
                {visiblePosts.map((post) => {
                  const isSelected = selectedPost?.id === post.id;
                  return (
                    <ViewAnnotation
                      // Key includes the selection state: on Android a
                      // ViewAnnotation rasterizes its children onto a
                      // bitmap and does NOT redraw them in place, so a
                      // fresh key forces a fresh (correct) bitmap.
                      key={`${post.id}-${isSelected ? "on" : "off"}`}
                      id={`pin-${post.id}`}
                      lngLat={[post.longitude, post.latitude]}
                      onPress={() => handleSelectPin(post)}
                    >
                      <Pressable onPress={() => handleSelectPin(post)}>
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: isSelected ? "#FFFFFF" : "#1B4332",
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: "#1B4332",
                          }}
                        />
                      </Pressable>
                    </ViewAnnotation>
                  );
                })}

                {/* Route line — dark green, matching the plant pin. */}
                {routeGeometry && (
                  <GeoJSONSource id="routeSource" data={routeGeometry}>
                    <Layer
                      id="routeLine"
                      type="line"
                      source="routeSource"
                      style={{
                        lineColor: "#1B4332",
                        lineWidth: 4,
                      }}
                    />
                  </GeoJSONSource>
                )}
              </Map>
            )}

            {/* Tapping the map while search is open dismisses search
                without selecting anything, per spec — sits above the
                map but below the recenter button/bottom card since
                those only ever render when search is closed anyway. */}
            {searchOpen && (
              <Pressable
                onPress={() => {
                  closeSearchDiscard();
                  handleMapPress(); // dismissing search also dismisses the pin
                }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
            )}

            {/* Only appears once a manual pan has paused auto-follow
                during active navigation — tapping it snaps back to the
                live position and re-enables auto-follow. Top-right so
                it never collides with the floating bottom card. */}
            {hasActiveRoute && !followingUser && (
              <Pressable
                onPress={handleRecenter}
                hitSlop={8}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                }}
              >
                <Text style={{ fontSize: 18 }}>⌖</Text>
              </Pressable>
            )}

            {/* Bottom card — floats OVER the map with margins and
                rounded corners on all sides, matching the mockup:
                bigger photo, black plant name, then location +
                pinned-by on their own row with the directions icon
                at the right. */}
            {selectedPost && (
              <View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 16,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  padding: 16,
                }}
              >
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: selectedPost.image_url }}
                    style={{ width: 88, height: 80, borderRadius: 12 }}
                  />
                  <View className="ml-4 flex-1">
                    <Text className="font-bold" style={{ color: "#000000", fontSize: 22 }}>
                      {selectedPost.name}
                    </Text>
                    {selectedPost.plant_slug &&
                      getPlantDetailsBySlug(selectedPost.plant_slug)?.scientific_name && (
                        <Text
                          className="italic"
                          style={{ color: "#6B7280", fontSize: 17, marginTop: 2 }}
                        >
                          {getPlantDetailsBySlug(selectedPost.plant_slug)!.scientific_name}
                        </Text>
                      )}
                  </View>
                </View>

                <View className="flex-row items-center mt-4">
                  <View className="flex-1">
                    {selectedPost.location_name && (
                      <Text style={{ color: "#6B7280", fontSize: 16 }}>
                        {selectedPost.location_name}
                      </Text>
                    )}
                    <Text style={{ color: "#6B7280", fontSize: 16, marginTop: 2 }}>
                      Pinned by: {selectedPost.profiles?.username ?? "Someone"}
                    </Text>
                  </View>

                  {/* Swaps: directions button before a route exists,
                      live ETA + Cancel once it does. */}
                  {!hasActiveRoute ? (
                    <Pressable
                      onPress={handleGetDirections}
                      disabled={routing}
                      hitSlop={10}
                      style={{ opacity: routing ? 0.5 : 1 }}
                    >
                      <Image
                        source={require("@/assets/images/icons/send icon(2).png")}
                        style={{ width: 36, height: 36 }}
                        resizeMode="contain"
                      />
                    </Pressable>
                  ) : (
                    <View className="flex-row items-center">
                      <Text style={{ color: "#1B4332", fontSize: 14 }}>
                        {etaMinutes !== null ? `${etaMinutes} minutes` : "Calculating..."}
                        {arrivalLabel ? ` • Arrive ${arrivalLabel}` : ""}
                      </Text>
                      <Pressable onPress={handleCancelRoute} className="ml-3">
                        <Text style={{ color: "#DC2626" }}>Cancel</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}