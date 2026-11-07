# Testing

`npm test` uses Node's test runner through tsx. Each API fixture has isolated users and a temporary SQLite database by default. TEST_DATABASE_URL opts into PostgreSQL/PostGIS, intended for CI. Real HTTP requests and real WebSocket connections test the coordination boundary; provider responses are labelled fixtures unless the separate smoke probe is explicitly enabled.

Tests cover unauthorized room access, explicit acceptance/decline, single-use tokens, independent consent, precise and coarse REST/socket delivery, absence of precise data in coarse storage, ETA-only payloads, expiry, stale fixes, coordinate validation/order, removal/blocking, lifecycle completion, manual delays/arrival, friend requests, session rotation, persistent SQL restart, provider-unavailable errors and revocation during slow routing. Browser preflight is included because direct HTTP success alone cannot prove CORS behavior.

Pure tests cover distance at the antimeridian, coordinate boundaries, cell reduction, dwell-based arrival classification, ranking with missing data, and Ideas schema validation. The arrival classifier is not a native geofence integration.

`npm run test:browser` drives two separate browser contexts through the exported app, with isolated test accounts and explicitly simulated GPS. It exercises forms, routing when opted in, targeted invitation acceptance, foreground updates, second-client delivery, revocation, PWA offline reload and Ideas. Screenshots go to ignored artifacts/. Do not publish them as evidence of physical GPS or native behavior.

Before release, extend coverage to PostGIS/Compose on an actual container host, iOS and Android builds, foreground permission denial/revocation, app suspension, file pickers, notification services, Dynamic Type, screen readers, landscape/tablet layouts, memory/battery measurement, network interruption while sharing, and signed binary update continuity. No latency, battery or scalability benchmarks are claimed.
