import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Builds a Cloudinary delivery URL from a path relative to your account's
 * upload root (e.g. "plants/akapulko.jpg").
 *
 * Use this for READING/displaying existing images (like the local plant
 * library in data/plants.ts) — uploadToCloudinary() below is for writing
 * new ones (scans, posts, avatars, chat images).
 */
export function cloudinaryUrl(path: string): string {
  if (!CLOUD_NAME) {
    console.warn(
      "EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — this image URL will be invalid."
    );
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${path}`;
}

type UploadResult = {
  url: string;
  publicId: string;
};

// Recommendation #3: union type instead of plain `string` — a typo like
// "scna" now fails at compile time instead of silently creating a stray
// Cloudinary folder. "messages" added for chat image attachments.
type CloudinaryFolder = "scans" | "posts" | "avatars" | "messages";

/**
 * Uploads a local image (from expo-image-picker) to Cloudinary.
 * @param imageUri local file uri, e.g. result.assets[0].uri
 * @param folder which Cloudinary folder to place it in, e.g. "scans" or "avatars"
 */
export async function uploadToCloudinary(
  imageUri: string,
  folder: CloudinaryFolder
): Promise<UploadResult> {
  // Recommendation #1: fail loudly and early instead of a confusing 401
  // from Cloudinary further down.
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Check EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env."
    );
  }

  const formData = new FormData();

  // React Native's `{ uri, type, name }` upload descriptor is NOT understood
  // by Expo's fetch (SDK 54+): it throws
  // "Unsupported FormDataPart implementation", which broke every Cloudinary
  // upload (scan saves, chat images, avatar changes). expo-file-system's
  // File implements Blob, so the multipart encoder can read its bytes() and
  // pick up its name/type for the part headers.
  const file = new File(imageUri);
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorBody}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

/**
 * Recommendation #4: stub for later. Deletion requires your Cloudinary API
 * secret, which can't live in the app bundle — this has to go through a
 * Supabase Edge Function. Not urgent, but the call site (e.g. "delete post",
 * "discard scan") won't need rewiring once you build the actual function.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const { supabase } = await import("@/utils/supabase");
  const { error } = await supabase.functions.invoke("delete-cloudinary-image", {
    body: { public_id: publicId },
  });

  if (error) {
    throw new Error(error.message ?? "Failed to delete Cloudinary image");
  }
}