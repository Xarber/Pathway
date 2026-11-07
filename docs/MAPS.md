# Maps

`JourneyMap.tsx` implements native rendering with react-native-maps; `JourneyMap.web.tsx` uses Leaflet. Both consume the same typed destination/origin/route/participant contract. A participant list provides essential information outside the map. Native selection uses long press; web uses click. Native fit-to-points and web fit-bounds show relevant markers. Coarse locations use area circles and explicit accuracy rather than masquerading as exact fixes.

The first native adapter uses Apple Maps on iOS and Google Maps on Android. Android requires a restricted Maps SDK key, supplied through `GOOGLE_MAPS_ANDROID_KEY` and the installed map config plugin. No paid account was configured. MapLibre remains the recommended future native open-map adapter; it is not currently installed. The architecture is not wholly dependent on proprietary navigation: backend routing and geocoding are replaceable and self-hostable.

Web tile URL and attribution are configured at export through `EXPO_PUBLIC_TILE_URL` and `EXPO_PUBLIC_TILE_ATTRIBUTION`. The local default uses OSM standard tiles for small development use. Display attribution; obey caching, identification and fair-use restrictions. No map tile prefetch or offline tile cache is provided. The PWA worker does not cache cross-origin tiles or API responses. Production should use an appropriately licensed provider or a self-hosted tile stack. Switching API instances does not automatically change the compiled tile provider.

Nominatim-compatible search is server-side at `GEOCODING_URL/search`, with an identifying `PROVIDER_CONTACT`. Do not point unlimited production traffic at public community endpoints. Search is explicit, not autocomplete. Without a geocoder, users can name/select coordinates or map points; unavailable search reports a clear error.

Provider documentation: [Expo maps](https://docs.expo.dev/versions/latest/sdk/map-view/), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). Native rendering, external-provider availability, traffic and transit layers have not been certified across physical devices.
