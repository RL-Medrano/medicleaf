import React, { useEffect, useState } from "react";
import {
  Image,
  ImageStyle,
  ImageSourcePropType,
  StyleProp,
  Modal,
  Pressable,
  Text,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { Directory, File, Paths } from "expo-file-system";

// Directory used to cache plant photos locally: <documentDirectory>/plant-images/
const CACHE_DIR = new Directory(Paths.document, "plant-images");

function ensureCacheDir() {
  if (!CACHE_DIR.exists) {
    CACHE_DIR.create();
  }
}

function localFileFor(cacheKey: string) {
  return new File(CACHE_DIR, `${cacheKey}.jpg`);
}

/**
 * Resolves a remote image to its best available uri: the cached local file
 * if one already exists, otherwise the remote url (while quietly downloading
 * a local copy in the background for next time). `cacheKey` should be
 * unique per image — a plant's single photo can use the plant id directly;
 * a gallery image should use something like `${plantId}-${index}`.
 * A null `remoteUrl` (bundled asset) resolves to null immediately — the
 * bundled require() source is rendered directly, no network involved.
 */
function useCachedUri(cacheKey: string, remoteUrl: string | null) {
  const [uri, setUri] = useState<string | null>(remoteUrl);

  useEffect(() => {
    let isMounted = true;
    // Bundled assets (require() → remoteUrl === null) need no cache/download.
    if (remoteUrl === null) {
      setUri(null);
      return;
    }

    // Past the guard, remoteUrl is a plain string — copy it to a const so
    // the narrowing also applies inside the async closure below.
    const url: string = remoteUrl;

    // Reset to the remote url whenever the target image changes, so a
    // stale cached uri from a previous plant/cacheKey never lingers.
    setUri(url);

    async function loadFromCacheOrDownload() {
      try {
        ensureCacheDir();
        const localFile = localFileFor(cacheKey);

        if (localFile.exists) {
          if (isMounted) setUri(localFile.uri);
          return;
        }

        const downloaded = await File.downloadFileAsync(url, localFile);
        if (isMounted && downloaded.exists) {
          setUri(downloaded.uri);
        }
      } catch {
        // Download failed (likely offline and not yet cached, or the
        // remote url is missing/broken) — keep whatever `uri` is currently
        // set to (the remote url by default). The <Image>'s own onError
        // handler is what ultimately decides whether to show a fallback.
      }
    }

    loadFromCacheOrDownload();
    return () => {
      isMounted = false;
    };
  }, [cacheKey, remoteUrl]);

  return uri;
}

/**
 * Normalizes a plant image source to a plain remote URL, or null when the
 * source is a bundled asset (require() → number), which loads instantly and
 * works offline forever with no cache involved.
 */
function resolveRemoteUri(source: ImageSourcePropType): string | null {
  if (typeof source === "number") return null; // bundled asset — no network
  if (typeof source === "string") return source; // plain URL (legacy/remote)
  if (Array.isArray(source)) {
    const first = source[0];
    return first == null ? null : resolveRemoteUri(first);
  }
  return source?.uri ?? null;
}

// ---------------------------------------------------------------------------
// Fallback placeholder — shown whenever an image (remote or cached) fails
// to load, instead of leaving a blank box or a broken-image glyph.
// ---------------------------------------------------------------------------

function ImageFallback({ style }: { style?: StyleProp<ImageStyle> }) {
  return (
    <View
      style={[
        style,
        {
          backgroundColor: "#6B6B6B",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          // White on the gray placeholder — matches the mockup (was near-black).
          color: "#FFFFFF",
          textAlign: "center",
          paddingHorizontal: 8,
        }}
        numberOfLines={2}
      >
        No image available
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Single image
// ---------------------------------------------------------------------------

type SingleImageProps = {
  plantId: string;
  /**
   * The plant photo: normally a bundled asset from require() (loads
   * instantly, works offline forever — no cache needed). A remote URL
   * string / { uri } source is also supported and gets downloaded to local
   * storage on first load like before.
   */
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  /** When true, tapping the image opens it in a fullscreen modal preview. */
  enableFullscreenPreview?: boolean;
};

/**
 * Renders a single plant photo. Bundled assets (the normal case for the
 * plant library) need no network at all; remote sources are cached to disk
 * on first successful load so they keep working offline afterwards. Falls
 * back to a "No image available" placeholder if the image can't be loaded.
 * Use <CachedPlantImageGallery> instead when a plant has more than one
 * photo to show.
 */
export function CachedPlantImage({
  plantId,
  source,
  style,
  resizeMode = "cover",
  enableFullscreenPreview = false,
}: SingleImageProps) {
  const remoteUri = resolveRemoteUri(source);
  const uri = useCachedUri(plantId, remoteUri);
  const isBundled = typeof source === "number";
  const [hasError, setHasError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Give a fresh image another chance rather than staying stuck in the
  // error state from a previous plant that reused this component instance.
  useEffect(() => {
    setHasError(false);
  }, [uri, source]);

  if (!source || hasError) {
    const fallback = <ImageFallback style={style} />;
    // Fallback isn't tappable into a fullscreen preview — there's nothing to preview.
    return fallback;
  }

  const image = (
    <Image
      source={isBundled ? source : { uri: uri ?? remoteUri ?? "" }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );

  if (!enableFullscreenPreview) {
    return image;
  }

  return (
    <>
      <Pressable onPress={() => setIsPreviewOpen(true)}>{image}</Pressable>

      <Modal
        visible={isPreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPreviewOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
          onPress={() => setIsPreviewOpen(false)}
        >
          <Image
            source={isBundled ? source : { uri: uri ?? remoteUri ?? "" }}
            className="w-full h-[80%]"
            resizeMode="contain"
          />
          <Pressable
            className="absolute top-[50px] right-5 w-9 h-9 rounded-full justify-center items-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onPress={() => setIsPreviewOpen(false)}
            hitSlop={10}
          >
            <Text className="text-white text-lg font-semibold">✕</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Gallery (up to 3 photos): swipeable inline, tap to open a swipeable
// fullscreen view starting at whichever photo was tapped.
// ---------------------------------------------------------------------------

function GallerySlide({
  cacheKey,
  source,
  style,
  resizeMode = "cover",
}: {
  cacheKey: string;
  /** Bundled require() asset, or a remote URL string / { uri } source. */
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain";
}) {
  const remoteUri = resolveRemoteUri(source);
  const uri = useCachedUri(cacheKey, remoteUri);
  const isBundled = typeof source === "number";
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri, source]);

  if (!source || hasError) {
    return <ImageFallback style={style} />;
  }

  return (
    <Image
      source={isBundled ? source : { uri: uri ?? remoteUri ?? "" }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

type GalleryProps = {
  plantId: string;
  imageUrls: ImageSourcePropType[]; // bundled requires and/or remote urls
  /** Size of each slide in the inline (non-fullscreen) carousel. */
  slideStyle: StyleProp<ImageStyle>;
  /** Skip the dots under the carousel when the caller renders its own. */
  hideDots?: boolean;
  /** Reports the visible slide index as the user swipes the inline carousel. */
  onIndexChange?: (index: number) => void;
};

export function CachedPlantImageGallery({
  plantId,
  imageUrls,
  slideStyle,
  hideDots = false,
  onIndexChange,
}: GalleryProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Flatten style to read a numeric width for paging math — falls back to a
  // reasonable default if the style is an array or doesn't set a width.
  const flatStyle = StyleSheet.flatten(slideStyle) as ImageStyle;
  const slideWidth = typeof flatStyle?.width === "number" ? flatStyle.width : 140;

  // No photos at all for this plant — show a single static placeholder
  // instead of an empty, non-scrollable gallery.
  if (!imageUrls || imageUrls.length === 0) {
    return <ImageFallback style={slideStyle} />;
  }

  function handleInlineScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(index);
    onIndexChange?.(index);
  }

  function handlePreviewScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setPreviewIndex(index);
  }

  function openPreviewAt(index: number) {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleInlineScroll}
        scrollEventThrottle={16}
      >
        {imageUrls.map((photo, index) => (
          <Pressable key={index} onPress={() => openPreviewAt(index)}>
            <GallerySlide cacheKey={`${plantId}-${index}`} source={photo} style={slideStyle} />
          </Pressable>
        ))}
      </ScrollView>

      {!hideDots && imageUrls.length > 1 && (
        <View className="flex-row justify-center mt-2">
          {imageUrls.map((_, index) => (
            <View
              key={index}
              className="w-1.5 h-1.5 rounded-full mx-1"
              style={{ backgroundColor: index === activeIndex ? "#1B4332" : "#D1D5DB" }}
            />
          ))}
        </View>
      )}

      <Modal
        visible={isPreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPreviewOpen(false)}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: previewIndex * screenWidth, y: 0 }}
            onMomentumScrollEnd={handlePreviewScrollEnd}
          >
            {imageUrls.map((photo, index) => (
              <GallerySlide
                key={index}
                cacheKey={`${plantId}-${index}`}
                source={photo}
                style={{ width: screenWidth, height: "100%" }}
                resizeMode="contain"
              />
            ))}
          </ScrollView>

          <Pressable
            className="absolute top-[50px] right-5 w-9 h-9 rounded-full justify-center items-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onPress={() => setIsPreviewOpen(false)}
            hitSlop={10}
          >
            <Text className="text-white text-lg font-semibold">✕</Text>
          </Pressable>

          {imageUrls.length > 1 && (
            <View className="flex-row justify-center absolute bottom-10 self-center">
              {imageUrls.map((_, index) => (
                <View
                  key={index}
                  className="w-1.5 h-1.5 rounded-full mx-1"
                  style={{
                    backgroundColor:
                      index === previewIndex ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bulk prefetch — for REMOTE image urls only (bundled plant assets from
// require() ship inside the app and need no prefetching). Example:
// await prefetchAllPlantImages(
//   someImages.map((img, i) => ({ cacheKey: `${img.plantId}-${i}`, imageUrl: img.remoteUrl }))
// );
// ---------------------------------------------------------------------------

export async function prefetchAllPlantImages(
  images: { cacheKey: string; imageUrl: string }[],
  onProgress?: (done: number, total: number) => void
) {
  ensureCacheDir();

  const total = images.length;
  let done = 0;

  for (const image of images) {
    const localFile = localFileFor(image.cacheKey);

    if (!localFile.exists) {
      try {
        await File.downloadFileAsync(image.imageUrl, localFile);
      } catch {
        // Skip for now — retried next run or picked up individually later.
      }
    }

    done += 1;
    onProgress?.(done, total);
  }
}