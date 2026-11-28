/**
 * Patches expo-asset AssetModule.kt for Kotlin 2.x compatibility.
 * Kotlin 2.x strict null-safety requires Context!! instead of Context? at call sites.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/expo-asset/android/src/main/java/expo/modules/asset/AssetModule.kt'
);

if (!fs.existsSync(filePath)) {
  console.log('[patch-expo-asset] File not found, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

const original = 'getPathPermissions(appContext.reactContext, localUrl.parent)';
const patched  = 'getPathPermissions(appContext.reactContext!!, localUrl.parent)';

if (content.includes(patched)) {
  console.log('[patch-expo-asset] Already patched, skipping.');
  process.exit(0);
}

if (!content.includes(original)) {
  console.log('[patch-expo-asset] Pattern not found, skipping (may be a newer version).');
  process.exit(0);
}

content = content.replace(original, patched);
fs.writeFileSync(filePath, content, 'utf8');
console.log('[patch-expo-asset] Patched AssetModule.kt for Kotlin 2.x compatibility.');
