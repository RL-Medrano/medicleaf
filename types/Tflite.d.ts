/**
 * types/tflite.d.ts
 *
 * TypeScript has no built-in idea what a `require("*.tflite")` resolves to,
 * so `loadTensorflowModel(MODEL_ASSET)` in plantClassifier.ts flags a type
 * error even though the value is fine at runtime (Metro's asset resolver
 * turns it into a numeric module ID, same as require()-ing a .png).
 *
 * This just tells TypeScript "trust the bundler" for this extension.
 * No changes needed anywhere else in the project.
 */
declare module "*.tflite" {
  const value: number;
  export default value;
}