const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

// .tflite is not a default Metro asset extension, so without this the
// require("@/assets/model/medicleaf_model.tflite") in utils/plantClassifier.ts
// fails to resolve.
if (!config.resolver.assetExts.includes("tflite")) {
  config.resolver.assetExts.push("tflite");
}

module.exports = withNativeWind(config, { input: './global.css' })