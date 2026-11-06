# Implementation plan

Pathway 0.1 is a working vertical slice, not a claim that the complete specification has shipped.

1. Foundation: npm monorepo, Expo SDK selected from stable npm tag, Fastify API, SQL repository adapters, shared validation and geospatial rules.
2. Accounts and planning: scrypt passwords, opaque revocable sessions, configured geocoding and Valhalla routing adapters; no synthetic route fallback.
3. Coordination: explicit invitation acceptance, owner lifecycle, member statuses/chat, grants independent of membership, server-filtered snapshots and authenticated WebSockets.
4. Client: accessible adaptive app, actual maps, planning, rooms, privacy controls, history, developer ideas, offline cached metadata without location history.
5. Verification: two users over real HTTP/WebSocket connections, adversarial privacy checks, persistence and expiry; TypeScript and production exports.
6. Delivery: documentation, PostGIS Compose, manual mobile builds and beta/stable gates. No public repository, deployment or release without authorization.

Acceptance: accounts → room → invite → accept → separate consent → live fix → coarse/ETA projection → revoke → viewer position removed → complete stops grants. Invalid, stale, out-of-order updates and unauthorized viewers fail closed. Approximate fixes are quantized before persistence. Route ETAs exist only after a provider response.

Risks: native background behavior requires development builds and physical devices. Docker and Xcode are unavailable here. Routing/geocoding require instance configuration and map coverage. Email delivery, provider sign-in, push credentials and store signing are external integrations. Advanced features remain explicitly tracked in ROADMAP.
