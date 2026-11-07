# Data model

`infra/schema.sql` is the initial idempotent schema. It is not a general migration framework: future changes must introduce numbered transactional migrations and test upgrades from a real old database before distribution.

- `users`: stable UUID, private unique email, public username/name, salted scrypt verifier.
- `sessions`: SHA-256 hash of opaque random bearer token, owner, creation and expiry.
- `journeys`: organizer, label/description, destination JSON, optional confirmed meeting point, status, creation/expiry.
- `participants`: room/user composite key, role, independent status, mode and manual delay.
- `invitations`: hashed 256-bit token, inviter, optional target, expiry and consumption time.
- `grants`: room/owner, explicit viewer UUIDs, precision, separate meeting-calculation permission and expiry.
- `live_locations`: one current fix per grant, sanitized precision, accuracy and measured timestamp. Cascade deletion from grants.
- `etas`: arrival, calculation timestamp, routing/manual provenance. No geometry or origin.
- `messages`, `proposals`, `friendships`, `blocks`, `reports`, `saved_places`: independent scoped records with foreign keys.

PostgreSQL adds generated `geography(Point,4326)` from the stored (already coarse when applicable) live coordinates and a GiST index. Sessions, grants, invitations and room membership have query indexes. IDs are UUIDs; coordinate validation excludes nonfinite/out-of-range values. JSON structures are validated at ingress.

Long-term history retains destination metadata and participation, not GPS trails. Live fixes are deleted after five minutes; grants expire within eight hours and never after the room. Room creation is limited to 24 hours lifetime. Server cleanup runs every ten seconds and before API transactions; read authorization also checks expiry directly. Restarts clean on subsequent requests/maintenance. Operational backups require their own deletion/retention policy; deleting rows does not erase old backups.

Developer Ideas have a separate device-local schema, documented in `features/DEVELOPER_IDEAS.md`. They are not automatically added to the server database or repository.
