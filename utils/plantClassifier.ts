/**
 * utils/plantClassifier.ts
 *
 * Runs the on-device .tflite plant classification model against a captured
 * photo, maps the predicted class index to a plant slug, and returns the
 * FULL plant details directly from plant_info.json — no Supabase involved
 * at all. Scan/Detection is fully self-contained and works offline.
 *
 * Files needed in assets/model/:
 *   medicleaf_model.tflite  produced by convert_to_tflite.py (the 0-255 -> [-1, 1]
 *                           scaling is baked into the model)
 *   labels.json             produced by convert_to_tflite.py (class names in the
 *                           model's output order)
 *   plant_info.json         plant details, keyed by the SAME class names
 *
 * Required packages (install if you don't have them yet):
 *   npx expo install expo-image-manipulator react-native-nitro-modules
 *   npm install react-native-fast-tflite jpeg-js buffer
 * and add "tflite" to resolver.assetExts in metro.config.js.
 *
 * react-native-fast-tflite v3 is built on Nitro Modules, which is why
 * react-native-nitro-modules is needed. This is a native module, so
 * after installing, rebuild the app:
 *   npx expo prebuild && npx expo run:android
 */

import { loadTensorflowModel, TensorflowModel } from "react-native-fast-tflite";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { Buffer } from "buffer";

import plantInfoData from "@/assets/model/plant_info.json";
import labelsData from "@/assets/model/labels.json";
const MODEL_ASSET = require("@/assets/model/medicleaf_model.tflite");

const MODEL_INPUT_SIZE = 224;

// Below this confidence, the result is treated as "Unknown Plant".
// Tune it against real phone photos, and re-check after retraining.
const CONFIDENCE_THRESHOLD = 0.85;

export type PlantDetails = {
  scientific_name: string;
  about: string;
  benefits: string[];
  preparation_methods: string[];
};

type PlantInfoMap = Record<string, PlantDetails>;
const plantInfo = plantInfoData as PlantInfoMap;

// Class names in the EXACT order of the model's output. labels.json is written
// by convert_to_tflite.py from the training folders, so index i of the model's
// output is labels[i]. (Do not rebuild this order from plant_info.json's keys:
// a single missing or extra key there would shift every prediction.)
// Each name must match a key in plant_info.json exactly, including casing.
const labels = labelsData as string[];

if (__DEV__) {
  const missing = labels.filter((name) => !(name in plantInfo));
  if (missing.length > 0) {
    console.warn(
      "[plantClassifier] classes in labels.json with no entry in plant_info.json:",
      missing
    );
  }
}

/**
 * Turns a slug into a display name, e.g. "aloe-vera" -> "Aloe Vera".
 * Multi-word/hyphenated keys are handled; add an explicit "name" field
 * to a specific plant_info.json entry later if you ever need a display
 * name that doesn't follow simple capitalization.
 */
export function getDisplayName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Load the model once and reuse it. If loading fails, allow a retry next time.
let modelPromise: Promise<TensorflowModel> | null = null;

function getModel(): Promise<TensorflowModel> {
  if (!modelPromise) {
    modelPromise = loadTensorflowModel(MODEL_ASSET, []).catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

/**
 * Resizes the captured photo to the model's input size and decodes it
 * into an RGB Float32Array of shape [size, size, 3] holding RAW 0-255
 * pixel values.
 *
 * Do NOT divide by 255 or apply any other normalization here: the .tflite
 * model already scales the pixels itself, so doing it twice makes the
 * predictions wrong (with no error).
 */
async function imageToInputTensor(uri: string): Promise<Float32Array> {
  // Giving both width and height stretches the photo to 224x224 with no
  // crop, which is how the training images were resized.
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE });
  const renderedImage = await context.renderAsync();
  const resized = await renderedImage.saveAsync({
    format: SaveFormat.JPEG,
    compress: 1,
    base64: true,
  });

  if (!resized.base64) {
    throw new Error("Failed to read resized image data for classification");
  }

  const buffer = Buffer.from(resized.base64, "base64");
  const decoded = jpeg.decode(buffer, { useTArray: true }); // RGBA, 4 bytes per pixel

  if (decoded.width !== MODEL_INPUT_SIZE || decoded.height !== MODEL_INPUT_SIZE) {
    throw new Error(`Unexpected image size ${decoded.width}x${decoded.height}`);
  }

  const input = new Float32Array(decoded.width * decoded.height * 3);
  let pixelIndex = 0;
  for (let i = 0; i < decoded.data.length; i += 4) {
    input[pixelIndex++] = decoded.data[i]; // R (0-255)
    input[pixelIndex++] = decoded.data[i + 1]; // G (0-255)
    input[pixelIndex++] = decoded.data[i + 2]; // B (0-255)
  }

  return input;
}

export type ClassificationResult = {
  slug: string;
  displayName: string;
  confidence: number; // 0–1
  identified: boolean; // false => treat as "Unknown Plant"
  details: PlantDetails | null; // null when !identified
};

/**
 * Runs the captured photo through the on-device model and returns the
 * FULL plant details directly from plant_info.json — no network call,
 * no plants table lookup. Call this from the Scanning screen right
 * after the photo is captured.
 */
export async function classifyPlantImage(
  localImageUri: string
): Promise<ClassificationResult> {
  const model = await getModel();
  const input = await imageToInputTensor(localImageUri);

  const inputBuffer = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength
  ) as ArrayBuffer;

  // Async run() (not runSync) so the JS thread stays free and the
  // loading spinner on the Scanning screen keeps animating.
  const outputs = await model.run([inputBuffer]);
  const scores = new Float32Array(outputs[0] as ArrayBuffer);

  if (scores.length !== labels.length) {
    throw new Error(
      `Model has ${scores.length} outputs but labels.json has ${labels.length} names — ` +
        "the .tflite and labels.json must come from the same conversion."
    );
  }

  let bestIndex = 0;
  let bestScore = scores[0];
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }

  const slug = labels[bestIndex];
  const identified = bestScore >= CONFIDENCE_THRESHOLD;
  const details = identified ? plantInfo[slug] ?? null : null;

  return {
    slug,
    displayName: getDisplayName(slug),
    confidence: bestScore,
    identified: identified && details !== null, // guard against a slug with no matching entry
    details,
  };
}

/**
 * Looks up a plant's details by slug directly from plant_info.json —
 * used by Scan Result when reopened from History, where we only have
 * the saved slug, not a fresh classification result.
 */
export function getPlantDetailsBySlug(slug: string): PlantDetails | null {
  return plantInfo[slug] ?? null;
}