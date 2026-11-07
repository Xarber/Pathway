# Realtime protocol v1

1. Authenticate REST using `Authorization: Bearer <opaque session>`.
2. Request `POST /api/v1/journeys/:id/ws-ticket` as a current member.
3. Open `/api/v1/live` using WSS in production.
4. Within five seconds, send `{ "ticket": "..." }` as the first JSON frame.
5. Receive `{ "type": "journey.snapshot", "data": <viewer-specific Journey> }`.

The ticket expires after 30 seconds and is consumed on use. It is bound to one room, user and current session. A disconnected client must obtain another ticket. Tokens are never query parameters. Session revocation or membership loss sends `access.revoked` and closes with 1008. Server shutdown closes with 1001.

Every API operation and ten-second maintenance cycle rebuilds each connected viewer's snapshot. Full snapshots eliminate delta ordering dependencies: clients replace the current room, then revalidate REST on reconnect. Every delivery rechecks live session, membership, grants and blocks. Location ownership cannot be chosen by a client. No location events are broadcast globally.

The current single-process implementation has no persisted event log, Redis fan-out, multi-replica ordering, heartbeat/backpressure policy or unlimited scale claim. The mobile client reconnects with capped exponential backoff and marks displayed positions stale when the socket is disconnected. Metadata remains available offline; GPS histories are never queued for later replay.
