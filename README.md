# Pathway

**Different paths. One destination.** An OpenRecode application for temporary journey coordination.

![Pathway icon](apps/mobile/public/icon-192.png)

Pathway 0.1.0 is an implemented development vertical slice. It is **not yet a production release** or a verified native application. The working flow connects accounts, individual planning, Journey Rooms, invitations, independent sharing consent, live room progress and revocation. Read the [feature status matrix](docs/FEATURES.md) before evaluating coverage against the full specification.

- Expo 58 / React Native 0.88 for iOS, Android and responsive web.
- Fastify 5 API and authenticated room WebSockets.
- PostgreSQL/PostGIS deployment adapter; SQLite for local development and tests.
- Configurable Valhalla routing and Nominatim-compatible search, without fabricated route fallbacks.
- Explicit, temporary precise / coarse / ETA-only / manual sharing.
- Light, dark and system appearance, privacy dashboard, saved places, history and device-local Developer Ideas.

## Start locally

Requires Node 24 and npm. No external services are needed for accounts and manual coordination.

```sh
npm ci
npm run db:migrate
npm run dev:server
```

In another terminal:

```sh
npm run web
```

The API defaults to `http://localhost:3001`; Expo web runs on port 8081. Routing/search report unavailable until providers are configured. Follow [development instructions](docs/DEVELOPMENT.md) for environment files, devices, provider configuration and production exports.

```sh
npm run typecheck
npm test
npm run build:server
npm run export:web
```

The production web output is `apps/mobile/dist`. A development build is required for native modules; Expo Go is not native verification.

## Documentation

[Start here](docs/INDEX.md) · [Architecture](docs/ARCHITECTURE.md) · [Privacy](docs/PRIVACY.md) · [Self-hosting](docs/DEPLOYMENT.md) · [Builds](docs/RELEASES.md) · [Test evidence](docs/reports/VALIDATION.md) · [Remaining work](docs/ROADMAP.md)

All original code is **AGPL-3.0-only**; third-party software and map data retain their licenses. No advertising or mandatory core subscription. No repository, service or release was published by this development session.
