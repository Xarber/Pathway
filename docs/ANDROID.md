# Android

Expo SDK 58 / React Native 0.88. Foreground location is contextual and independent of room acceptance. Android map rendering requires a restricted Maps SDK key, configured through `GOOGLE_MAPS_ANDROID_KEY`. Session tokens use SecureStore; local metadata/Ideas use SQLite. Deep links, sharing and file import use platform adapters.

No background permission, foreground location service or persistent tracking notification is enabled. Those features require a dedicated implementation and physical testing before activation. Do not claim background reliability from the foreground collector. Push/local notifications, widgets, package self-updates and Play In-App Updates are not implemented.

On an already configured Android toolchain:

```sh
cd apps/mobile
npx expo run:android --device
```

Use an HTTPS instance for physical devices; localhost refers to the phone. Emulator-only development can use `http://10.0.2.2:3001`. Release APK/AAB workflows require an existing secured release keystore and restricted map key. The release signing plugin prevents falling back to the template debug signing identity. Never generate a replacement key for an established release. Native build/install and permission/battery/lifecycle behavior are unverified here.
