MedicLeaf plant photos — BUNDLED INTO THE APP (offline forever)
================================================================

Every file in this folder is compiled into the APK at build time
(data/plants.ts require()s each one), so the plant library, search,
home cards, and plant detail gallery all work with zero internet.

HOW TO ADD YOUR PHOTOS
----------------------
1. The current files are PLACEHOLDERS — flat green tiles with the
   filename written on them, so the app builds and runs right away.
2. Replace each placeholder with a real photo, keeping the EXACT same
   filename and extension (right-click > Save as, or drag your photo
   over the file and confirm the replace).
3. Do NOT rename or delete files — data/plants.ts references every
   filename below with require(); a missing file breaks the build.

NAMING PATTERN (40 plants x 5 photos = 200 files)
-------------------------------------------------
  <plant-id>.jpg        main photo (home cards, search, all-plants list)
  <plant-id>-2.jpg      gallery photo 2 (plant detail screen)
  <plant-id>-3.jpg      gallery photo 3
  <plant-id>-4.jpg      gallery photo 4
  <plant-id>-5.jpg      gallery photo 5

Example: akapulko.jpg, akapulko-2.jpg, akapulko-3.jpg, ...

The full, exact list is whatever appears in data/plants.ts — that file
is the source of truth for filenames.

SIZE GUIDE (important for APK size)
-----------------------------------
- Resize photos to at most ~1200px wide, JPEG quality ~80
  (most phone cameras shoot 4000px+, way bigger than the app needs).
- Target: roughly 150-400 KB per photo.
- 200 photos x ~300 KB = about 60 MB added to the APK.
- Dropping in full-resolution multi-MB photos would push the APK
  toward hundreds of MB.

After adding/changing photos, rebuild the APK
(./gradlew assembleRelease) — images are only picked up at build time.
