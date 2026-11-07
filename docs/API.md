# API v1

Base `/api/v1`. JSON requests and responses. Bearer authentication is required except registration, login, capabilities and health. Validation errors return 400; invalid sessions 401; permission failures 403; inaccessible rooms/invites 404; stale/conflicting actions 409; rate limit 429; provider failures 503. Internal SQL errors are redacted. Mutations return `{ok:true}` or a fresh authorized object. Responses are no-store.

| Area | Routes | Behavior |
|---|---|---|
| Discovery | `GET /capabilities`, `GET /health` (outside API prefix) | API/version/build and configured capabilities |
| Accounts | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /me`, `/sessions`; `DELETE /sessions/:hash`, `/account` | Register with email/password/name/username; account deletion requires password |
| Journeys | `GET/POST /journeys`; `GET/PATCH /journeys/:id`; `POST .../start`, `.../complete`, `.../cancel` | Member reads, owner edits/lifecycle |
| Invitations | `POST /journeys/:id/invite`; `DELETE .../invitations`; `GET /invitations`; `POST /invitations/accept`, `/:hash/accept`, `/:hash/decline` | Optional target username; raw token returned only on creation; single use |
| Membership | `POST /journeys/:id/leave`; `DELETE .../participants/:userId`; `PATCH .../status` | Role checks, independent participant mode/status/delay |
| Consent | `POST/DELETE /journeys/:id/sharing`; `POST /sharing/stop-all`; `GET /privacy` | Current user only; mode, explicit viewers, expiresAt, allowMeeting |
| Fixes | `POST /journeys/:id/location` | latitude, longitude, accuracy, timestamp; active appropriate grant required |
| Planning | `POST /routes/calculate`; `GET /places/search?q=...`; `POST /journeys/:id/eta` | origin/destination/mode; optional manual ETA; provider provenance |
| Meeting | `POST /journeys/:id/meeting-points`, `.../meeting-points/suggest`, `.../meeting-points/:proposalId/confirm` | User proposals; consent-gated route ranking; owner confirmation |
| Messages | `POST /journeys/:id/messages`; `DELETE .../messages/:messageId` | Member writes; author/owner deletes; current snapshot latest 100 |
| Social | `GET /users/search?q=...`, `/friends`; `POST /friends/requests`, `.../:id/accept`; `DELETE /friends/:id`; `POST /blocks`, `/reports` | Username search, explicit relationships, block filtering |
| Places/history | `GET/POST /saved-places`; `DELETE /saved-places/:id`, `/history` | User scope and completed-room metadata deletion |
| Realtime | `POST /journeys/:id/ws-ticket`; WebSocket `/api/v1/live` | First-frame single-use room/session ticket |

Example create body: `{title:'School', destination:{label:'School entrance',latitude:41.9,longitude:12.49}, mode:'walking'}`. Grants require `{mode:'approximate',viewers:[<UUID>],expiresAt:<epoch ms>,allowMeeting:false}`. No API accepts a different grant owner.

Shared client contracts are in `packages/shared/src/index.ts`. Input bodies use strict Zod schemas. Snapshots expose only authorized participant locations/ETAs and public display identity, never private email/password/session hashes. Query paths use current-snapshot semantics rather than pagination everywhere; room size is capped at 20, message reads at 100 and search at 10. Full cursor pagination, an OpenAPI document and per-user rate limiting remain future improvements.
