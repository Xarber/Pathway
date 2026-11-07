#!/usr/bin/env bash
set -euo pipefail
variant="${1:?Use ios-unsigned, ios-simulator, android-apk or android-aab}"
: "${EXPO_PUBLIC_API_URL:?Set the intended HTTPS instance origin}"
[[ "$EXPO_PUBLIC_API_URL" == https://* ]] || { echo 'Release builds require HTTPS'; exit 1; }
project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root/apps/mobile"
mkdir -p "$project_root/artifacts"
version="$(node -p 'require("./package.json").version')"
commit="$(git rev-parse --short=12 HEAD)"
channel="${RELEASE_CHANNEL:-development}"
export EXPO_PUBLIC_BUILD_COMMIT="$(git rev-parse HEAD)"
export CI=1
if [[ "$variant" == ios-* ]]; then
  npx expo prebuild --platform ios --no-install
  (cd ios && pod install)
  if [[ "$variant" == ios-unsigned ]]; then
    xcodebuild -workspace ios/Pathway.xcworkspace -scheme Pathway -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -archivePath "$project_root/artifacts/Pathway.xcarchive" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO archive
    mkdir -p "$project_root/artifacts/package/Payload"
    cp -R "$project_root/artifacts/Pathway.xcarchive/Products/Applications/Pathway.app" "$project_root/artifacts/package/Payload/"
    (cd "$project_root/artifacts/package" && zip -qry "../Pathway-v${version}-${channel}-${commit}-ios-unsigned.ipa" Payload)
    /usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$project_root/artifacts/package/Payload/Pathway.app/Info.plist"
    lipo -archs "$project_root/artifacts/package/Payload/Pathway.app/Pathway"
  else
    xcodebuild -workspace ios/Pathway.xcworkspace -scheme Pathway -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "$project_root/artifacts/derived" CODE_SIGNING_ALLOWED=NO build
    ditto -c -k --sequesterRsrc --keepParent "$project_root/artifacts/derived/Build/Products/Release-iphonesimulator/Pathway.app" "$project_root/artifacts/Pathway-v${version}-${channel}-${commit}-ios-simulator.app.zip"
    lipo -archs "$project_root/artifacts/derived/Build/Products/Release-iphonesimulator/Pathway.app/Pathway"
  fi
else
  : "${GOOGLE_MAPS_ANDROID_KEY:?Configure a restricted Maps SDK key for Android}"
  : "${PATHWAY_KEYSTORE_PATH:?Existing release keystore required}"
  : "${PATHWAY_KEYSTORE_PASSWORD:?Keystore password required}"
  : "${PATHWAY_KEY_ALIAS:?Key alias required}"
  : "${PATHWAY_KEY_PASSWORD:?Key password required}"
  npx expo prebuild --platform android --no-install
  if [[ "$variant" == android-apk ]]; then
    (cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86,x86_64)
    cp android/app/build/outputs/apk/release/app-release.apk "$project_root/artifacts/Pathway-v${version}-${channel}-${commit}-android-universal.apk"
  elif [[ "$variant" == android-aab ]]; then
    (cd android && ./gradlew :app:bundleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86,x86_64)
    cp android/app/build/outputs/bundle/release/app-release.aab "$project_root/artifacts/Pathway-v${version}-${channel}-${commit}-android.aab"
  else
    echo 'Unknown build variant'; exit 1
  fi
fi
