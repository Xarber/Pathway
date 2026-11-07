# iOS and iPadOS

Expo SDK 58 / React Native 0.88. Foreground location uses expo-location after a contextual user action. SecureStore stores session secrets with device-only, unlocked access. Native maps use Apple Maps. Expo Linking handles `pathway://join?token=...`; native sharing uses the platform share sheet. Developer Ideas import/export use the document picker and share sheet.

No background location mode or Always permission is enabled. Collector subscriptions stop when the app backgrounds. Background tracking, push/local notification delivery, Live Activities, widgets, Siri/App Intents, Apple sign-in and watch support are not implemented. Do not infer those capabilities from installed SDK dependencies.

Development client on an existing Xcode installation:

```sh
cd apps/mobile
npx expo run:ios --device
```

Physical device provisioning/signing must be configured by the developer. Unsigned device packaging and simulator packaging have separate GitHub Actions variants. An unsigned IPA cannot be installed on ordinary devices without signing. iOS compilation, simulator launch, location permissions, share/file pickers and physical-device lifecycle are unverified in this environment because full Xcode/devices were unavailable.
