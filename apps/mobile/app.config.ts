// SPDX-License-Identifier: AGPL-3.0-only
import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'Pathway',
  slug: 'pathway',
  version: '0.1.0',
  scheme: 'pathway',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'org.openrecode.pathway',
    supportsTablet: true,
    buildNumber: '1',
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'org.openrecode.pathway',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-foreground.png',
      backgroundColor: '#6269F5',
      monochromeImage: './assets/monochrome.png',
    },
  },
  web: { bundler: 'metro', output: 'static', favicon: './public/icon-192.png' },
  plugins: [
    './plugins/withReleaseSigning.cjs',
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY }],
    'expo-router',
    'expo-secure-store',
    'expo-sqlite',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Pathway uses your location when you preview a route or explicitly share foreground journey progress. Background tracking is not enabled.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
  ],
  extra: { apiVersion: 1 },
};
export default config;
