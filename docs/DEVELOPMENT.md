# Development

## Install and run

Node 24+ and npm are required. From the repository root:

```sh
npm ci
npm run assets
npm run db:migrate
npm run dev:server
```

This defaults to a local `pathway.sqlite`. Start the frontend in another terminal:

```sh
npm run web
# or
npm run dev
```

For PostgreSQL (Docker must already be installed):

```sh
cp .env.example .env
# Set POSTGRES_PASSWORD and matching DATABASE_URL in .env.
docker compose --env-file .env -f infra/compose.yml up -d db
set -a
. ./.env
set +a
npm run db:migrate
npm run dev:server
```

Use a long URL-safe database password or properly percent-encode it in DATABASE_URL. The example Compose interpolation expects URL-safe characters.

Expo environment goes in `apps/mobile/.env`, independent of the server's root environment. Set `EXPO_PUBLIC_API_URL` to the intended reachable origin. Public Expo variables are embedded in the application; never put credentials there. Native Android also uses the restricted `GOOGLE_MAPS_ANDROID_KEY` during prebuild. Run `npx expo install --check` in apps/mobile after dependency changes.

## Providers

Set `ROUTING_URL` to your Valhalla origin and `GEOCODING_URL` to your Nominatim-compatible origin. Search/routing fail honestly if not configured. For the optional Compose routing profile, put a regional `.osm.pbf` in `infra/routing-data`, start `--profile routing`, and use `ROUTING_URL=http://routing:8002` for the container API. Routing graph construction can require substantial RAM/time; no data or large local toolchains are automatically downloaded.

Native map config and web tiles are documented in MAPS.md. Notifications have no configured delivery backend or credentials; there is no push setup claimed complete. Location permissions are foreground-only in `app.config.ts`, requested contextually, with no background entitlement.

## Validate and export

```sh
npm run typecheck
npm test
npm run build:server
npm run export:web
npm run test:browser
```

The browser test starts disposable API/static servers on localhost 3001/4173; ensure those ports are free. It uses installed Chrome locally and Playwright Chromium in CI. Synthetic GPS and accounts are confined to a temporary database. It does not prove native GPS. Optionally set ROUTING_URL explicitly for the real-provider route step; otherwise network-routing UI is skipped, never treated as passing.

```sh
ROUTING_URL=https://your-valhalla.example.org npx tsx scripts/provider-smoke.ts
```

To export native JavaScript/assets without compiling a native binary:

```sh
cd apps/mobile
npx expo export --platform ios --platform android --output-dir ../../artifacts/native-export
```

Native development/build instructions are in IOS.md, ANDROID.md and RELEASES.md. Do not install Xcode/SDKs/emulators as a hidden dependency of running tests.
