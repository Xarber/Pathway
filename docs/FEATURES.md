# Feature status — 0.1.0 development

Status refers to observed evidence, not the eventual product promise. “Tested” below means automated API/unit or web-browser checks only unless a native target is explicitly named. No feature has physical iOS/Android validation yet.

| Major feature | Status | Evidence / limit |
|---|---|---|
| Account registration/password sign-in | Implemented and tested | Real HTTP + two browser forms; private test accounts |
| Session rotation, revocation and session list | Implemented and tested | API/socket checks; list UI |
| Email verification, reset, passkeys, Apple sign-in | Not implemented | Account release gate |
| Guest identities/onboarding wizard/avatar | Not implemented | Contextual privacy explanations exist in account flow |
| Friends and requests | Implemented and tested | API lifecycle; browser UI not fully exercised |
| Blocking | Implemented and tested | Immediate per-viewer filtering and invitation restrictions |
| Abuse reports | Implemented but not fully tested | Persistence/API/UI; no staffed moderation service |
| Journey creation/lifecycle | Implemented and tested | API + browser; organizer completion, expiry |
| Invite, accept, decline, leave, removal | Implemented and tested | HTTP/WS and targeted browser acceptance |
| Planner destination coordinates/map selection | Implemented and tested | Web browser coordinate flow |
| Destination text search | Implemented but not fully tested | Nominatim-compatible adapter; no live geocoder validation |
| Interactive map and route preview | Implemented and tested (web) | Leaflet rendered; Valhalla real-route browser probe |
| Native interactive maps | Implemented but not fully tested | iOS/Android source adapter; Android key unavailable |
| Walking/cycling/driving/scooter routing | Partially implemented | Valhalla adapter; live walking probe only; scooter labelled cycling estimate |
| Transit/mixed-mode routing | Not implemented | Explicit unavailable error |
| Saved places/default transport | Implemented but not fully tested | API/UI and local preference; no exhaustive browser flow |
| Sharing modes/explicit viewers | Implemented and tested | Independent grant tests; precise browser sharing |
| Foreground location collection | Implemented and tested (browser) | Synthetic browser GPS through real API/WS; native unverified |
| Approximate/ETA-only privacy | Implemented and tested | Coarse persisted data, REST/socket checks; no precise fields in ETA payloads |
| Sharing expiry/revocation/stale data | Implemented and tested | API/WS + browser revocation; slow-provider regression |
| Background location/Android service | Not implemented | Permissions/modes deliberately disabled |
| Participant status/manual delay/arrival | Implemented and tested | API; native interaction unverified |
| Group ETAs | Partially implemented | Routing/manual provenance and partial summary; no automatic periodic recalculation |
| Meeting proposals/confirmation | Implemented and tested | Membership and organizer rules |
| Candidate travel-time comparison | Partially implemented | Real routing adapter and ranking; consent gate and two-origin provider-fixture success tested; live comparison/device flow still unverified |
| Safe candidate discovery/meet-along-route | Not implemented | Manual candidate proposals are available |
| Shared route segments/together state | Not implemented | No automatic grouping from GPS proximity |
| Arrival detection | Partially implemented | Pure dwell/accuracy classifier tested; not connected to native geofences |
| Quick messages/chat | Implemented and tested | Latest 100 messages and member identity; no full messaging platform |
| Push/local notifications/preferences | Not implemented | SDK dependency does not establish delivery support |
| Journey history/privacy dashboard | Implemented but not fully tested | UI + server snapshots; deletion edges require more testing |
| Offline/reconnection | Partially implemented | PWA offline reload tested; cached metadata/backoff; no offline routing/status queue |
| Versioned API/WebSockets | Implemented and tested | Real sockets, room/session authorization, single process |
| PostgreSQL/PostGIS | Implemented but not fully tested | SQL adapter, generated geography/index, CI config; no local Docker |
| Self-hosting | Implemented but not fully tested | Container/Compose/TLS examples; no deployment executed |
| Developer Options/Ideas | Partially implemented | Browser create, persistence adapter and schema tests; import conflict rules tested; history/batch/native coverage incomplete |
| Changelog/What's New | Partially implemented | Local structured notes, no-first-install rule; no actual upgrade installation tested |
| PWA | Partially implemented | Manifest, SW registration/offline shell tested in Chrome; actual device installation/update lifecycle unverified |
| Native update installation/OTA | Not implemented | Optional metadata check only; no activated release source |
| Deep links/share/file picker | Implemented but not fully tested | Native adapters and web join redirect; physical platform controls unverified |
| Light/dark/responsive/accessibility | Partially implemented | Responsive browser visuals inspected; no full screen-reader/Dynamic Type audit |
| Layered icon/branding | Implemented but not fully tested | SVG sources and reproducible exports; native mask review incomplete |
| Live Activities/widgets/watch | Not implemented | Future authorized scope |
| Secure plugin runtime/P2P/federation | Not implemented | Adapter seams only; no arbitrary plugin execution |
| Four-format native build workflows | Implemented but not fully tested | Workflow/scripts prepared; no native binaries or remote runs |
| Release/distribution/deployment | Not implemented | No public destination authorized or activated |
