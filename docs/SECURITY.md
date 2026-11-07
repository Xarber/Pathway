# Security architecture and release gates

Opaque 256-bit sessions are hashed in storage, expire after seven days and rotate on refresh. Passwords use Node scrypt with a per-password random salt (versioned N=32768, r=8, p=3 parameters); there are no embedded credentials. Native secrets use device-only SecureStore access while unlocked. Browser tokens are session-scoped and vulnerable to origin compromise; avoid untrusted scripts. Email verification, password reset, passkeys and Apple sign-in are outstanding account release requirements.

Every scoped operation checks room membership; owner actions check organizer identity. Every grant belongs to the session user. Viewer projections enforce grants, precision, expiry and blocking. Realtime tickets expire after 30 seconds, are single-use, travel in the first socket frame and remain tied to a live session. Unauthenticated sockets close after five seconds. Payload sizes, API request bodies and request rates are bounded. Rate limits are per direct client IP; reverse-proxy deployments must deliberately configure trusted proxy ranges before relying on forwarded addresses. Do not trust arbitrary X-Forwarded-For.

The API emits no request-body logs, tokens, coordinate logs or raw database errors. Zod validates input. Queries are parameterized. Responses are no-store. SQL changes and snapshots are serialized; provider I/O happens outside locks and revalidates consent afterward. Third-party provider URLs are operator-controlled, not untrusted client proxy inputs.

## Remaining hardening

Before public production: verify account recovery/verification, deploy TLS and hardened headers, review CORS/WS Origin policy, add authenticated-user rate limits and upstream abuse controls, bound live socket counts/backpressure, load-test multi-room usage, review backup expiry and instance moderation, test PostGIS/container builds, and audit dependencies. No security certification or full audit is claimed.

The initial npm audit reported five moderate transitive findings in Expo tooling (`glob`/`minimatch` paths). No high or critical finding was reported. npm suggested an incompatible SDK downgrade; this was not applied. Track supported upstream fixes instead of forcing a breaking dependency replacement. See the validation report for final audit state.
