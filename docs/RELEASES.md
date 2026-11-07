# Builds and releases

No remote repository, public release, store submission, deployment, signing identity or distribution source is configured. The local license is open-source; repository visibility is a separate authorization.

`testing` is development integration. `beta`/`main` are reserved channels; no stable promotion is justified by this initial vertical slice. Full builds trigger only on beta/main or manual dispatch. Checks on testing are manual. Conventional Commits apply. No remote workflow was launched.

`.github/workflows/mobile.yml` defines four independent jobs (matrix entries): unsigned device IPA, iOS simulator app.zip, signed universal APK and signed AAB. Successful artifacts upload independently even when another variant fails. Validation is separate; the final readiness job requires all builds. Publication is intentionally disabled because authorization and full artifact/store validation are outstanding. Do not enable a release merely because packages built.

## Existing-toolchain commands

```sh
EXPO_PUBLIC_API_URL=https://your-instance.example.org RELEASE_CHANNEL=beta bash scripts/build-mobile.sh ios-unsigned
EXPO_PUBLIC_API_URL=https://your-instance.example.org RELEASE_CHANNEL=beta bash scripts/build-mobile.sh ios-simulator
```

Android additionally requires existing values in `PATHWAY_KEYSTORE_PATH`, `PATHWAY_KEYSTORE_PASSWORD`, `PATHWAY_KEY_ALIAS`, `PATHWAY_KEY_PASSWORD`, and `GOOGLE_MAPS_ANDROID_KEY`:

```sh
EXPO_PUBLIC_API_URL=https://your-instance.example.org RELEASE_CHANNEL=beta bash scripts/build-mobile.sh android-apk
EXPO_PUBLIC_API_URL=https://your-instance.example.org RELEASE_CHANNEL=beta bash scripts/build-mobile.sh android-aab
python3 scripts/checksums.py
```

CI uses matching GitHub secrets and `vars.PATHWAY_API_URL`. Signing keys must remain continuous and private. Do not replace them or use debug signing for release. IPAs are unsigned device packages requiring later signing; simulator bundles are a different artifact. Native compilation scripts are prepared but not validated with local Xcode/Gradle here. Future publication must additionally verify package IDs, binary versions, signing certificates, required architectures, bundled JS/assets, all formats, checksums and exact commit. Current checksums alone do not constitute that validation.

Future authorized releases must publish structured native/GitHub update metadata and full corresponding AGPL source, preserve rollback artifacts, and update only approved distribution channels. There is no Android self-updater, OTA publication, AltSource, Obtainium endpoint or automatic native update installation in 0.1.

The web exporter generates a versioned static shell cache and update notification. The user chooses when to reload, preserving unsaved work until then. It never caches private API data or cross-origin map tiles. Web prompts fetch structured release highlights before reload. Actual multi-version worker upgrade, binary updates and What's New need further validation before production release. Settings contains structured local changelog entries and an optional HTTPS stable-manifest check; no manifest endpoint is currently activated.
