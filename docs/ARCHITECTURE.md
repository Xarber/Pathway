# Architecture

The npm monorepo shares contracts, geospatial calculations and API transport. `apps/mobile` is the single Expo app for native and web; a separate duplicate web application is deliberately avoided. Expo Router owns entry and invitation deep links. TanStack Query handles server snapshots; local component state handles forms. Screens use shared theme-aware controls and platform-specific map/storage adapters.

## Server

Fastify composes routes in `src/routes/{accounts,journeys,sharing,coordination,social}.ts`. `context.ts` defines their service contract. `app.ts` owns SQL transaction sequencing, session authorization, room membership, per-viewer snapshot projection, expiry maintenance and WebSocket transport. `auth.ts`, `db.ts` and `providers.ts` isolate credential handling, persistence and external services.

One API process is supported. Database operations are serialized on one connection and transactional to make consent changes atomic. Routing/search run outside the transaction; ETA and meeting results revalidate session, membership and grants before committing or returning. This prevents a slow provider from blocking revocation. It is not a horizontally scalable architecture yet; do not add replicas until distributed ordering, publication and revocation are implemented and tested.

WebSockets send current, viewer-specific snapshots, not coordinate broadcasts. Subscriptions use a short-lived, single-use ticket in the first frame, bound to both room and session. No bearer token is put in a URL. Every mutation and maintenance cycle rebuilds projections. Reconnection requests a new ticket and snapshot. There is no replayed GPS history.

## Data and platform boundaries

PostgreSQL is the production adapter; PostGIS adds a generated geography point and GiST index for ephemeral authorized fixes. Node SQLite uses the same relational schema for local development. Native local metadata and Ideas use Expo SQLite. Native tokens use SecureStore. Browser sessions use sessionStorage, metadata/Ideas use localStorage. No local location history is persisted by the client.

Foreground collection lives in the session provider, independently of visible tabs. It starts only after explicit precision/viewer selection and foreground permission. Native app background transitions stop collection. Restarts never automatically restart collection. Grants may remain active until revoked or expired, so the privacy dashboard distinguishes server grant state from collector state.

## Extensibility and limitations

Mapping and routing providers, storage adapters, pure privacy calculations and shared validation are extension seams. A versioned plugin registry/sandbox is **not implemented**. There is no arbitrary downloaded code execution. Email delivery, push fan-out, passkeys, background services, transit, automatic route interception, federation and P2P transport remain future modules. The server currently coordinates location over TLS to a trusted instance; this is not end-to-end encrypted or peer-to-peer sharing.
