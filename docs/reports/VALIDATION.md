# Validation report — 2026-11-07

## Scope and conclusion

Pathway 0.1.0 is a working development vertical slice, **not the completed production specification**. The implemented boundary connects accounts, real individual route requests, Journey Rooms, invitation acceptance, explicit per-viewer consent, foreground sharing, authorized live delivery and revocation. All other features have explicit status in [FEATURES](../FEATURES.md).

Inspected/changed: the new Expo screens and platform storage/maps, Fastify route modules and snapshot authorization, SQL adapters/schema, shared validation/geospatial functions, PWA exporter, native build scripts, Compose and project docs. No unrelated project or live infrastructure was modified. No full security, accessibility, battery or production audit is claimed.

## Environment

macOS arm64; Node 24.14.0; npm 11.9.0; TypeScript 5.9.3; Expo 58.0.23; React Native 0.88.1; Fastify 5.12.8. Expo dependency compatibility check passed. Xcode full SDKs, Docker, Android SDK/emulator and physical devices were unavailable. No large toolchain was installed.

## Executed checks

| Check | Result | Evidence and boundary |
|---|---|---|
| Automated unit/API/WS tests | Passed: 25 tests | Real local HTTP and socket clients; isolated SQLite databases; provider fixtures explicitly labelled |
| TypeScript | Passed | Root server/shared and strict Expo app checks |
| Compiled server | Passed | tsc build plus compiled in-memory API health smoke |
| Production web export | Passed | Static routes, generated SDK 58 scripts/styles and PWA shell |
| Two-browser end-to-end | Passed | Separate desktop and phone-sized Chrome contexts, synthetic GPS, real local API/WS |
| Live routing probe | Passed | Public Rome landmarks through Valhalla; 1,700 m, 1,327.811 s, 187 geometry points, 31 instructions in the initial standalone response |
| iOS/Android JS/assets export | Passed | Hermes bundles for both native platforms; **not native compilation or installation** |
| Shell / JSON / YAML syntax | Passed | Native shell syntax, selected JSON documents, workflow/Compose parsing; not workflow execution |
| npm audit | Five moderate findings | Expo transitive glob/minimatch paths; no high/critical findings; breaking SDK downgrade not applied |
| PostGIS / Compose runtime | Not executed | Docker unavailable; prepared manual CI includes PostGIS service tests |
| Native device/simulator/APK/AAB builds | Not executed | No compiled IPA, simulator app, APK or AAB produced |
| Releases, deployment, distribution | Not executed | No remote repository or approved publication destination |

Local raw evidence is under ignored `artifacts/`: unit-tests.log, typecheck.log, server-build.log, web-export.log, browser-test.log, audit.json, browser PNGs and native JavaScript export. Raw evidence is not a public artifact or physical-device proof.

## Browser scenario

Two separate contexts register isolated QA accounts. The organizer chooses coordinates, calculates a real route (when ROUTING_URL is explicitly supplied), creates a room, sends a targeted username invitation, and the recipient accepts in their own session. The organizer selects that participant and precise sharing, grants browser foreground location, and a synthetic GPS fix travels through the real API/socket boundary. The recipient sees authorized progress. Stop Sharing removes the position from the recipient and stops local collection. No participant movement is fabricated by the app.

The same run verifies manifest metadata, service-worker readiness, offline shell reload, Developer Options triple-tap, Ideas creation, main-tab access expiry and persistence across page reload. The test database is temporary and removed. Browser GPS simulation is clearly separate from real native GPS.

## Privacy/security regressions covered

Unauthorized reads and socket ticket requests; accepting before membership; targeted/single-use invite enforcement; independent grant ownership; approximate coordinates reduced in storage/REST/WS; ETA-only absence of location/route geometry; stale and expired fixes; invalid/out-of-order updates; blocking and removal; journey completion; session rotation/socket revocation; SQL persistence; provider-unavailable errors; consent-gated meeting calculations; group ETA provenance; slow routing cannot block revocation or publish a late ETA; browser DELETE/PATCH preflight; Ideas duplicate IDs/conflicts/default-preserving merge.

## Issues found and corrected

- Expo's favicon exporter rejected an SVG input: kept the layered source and used a PNG exporter input.
- Importing native SQLite in the web bundle required WASM unnecessarily: added a separate browser storage adapter.
- Expo SDK 58 custom HTML omitted generated document nodes: included the supported context nodes so the exported app hydrates and loads styles/scripts.
- Browser CORS defaults excluded DELETE/PATCH despite direct API tests passing: enabled the intended methods and added a preflight regression test.
- Provider I/O initially held the SQL transaction: split preparation/work/finalization and revalidate consent, allowing immediate revocation while routing is slow.
- Navigation retained the previous form's scroll position: reset scrolling on user, tab and selected-room changes; inspected the corrected mobile Home screenshot.
- Unknown native location accuracy could become zero: suppress unknown-accuracy fixes rather than claiming perfect precision.
- Fractional provider durations could produce a non-integer PostgreSQL BIGINT ETA: round to milliseconds and cover it with a regression test.
- Native ScrollView's current ref type differs from older React Native classes: use the component-ref type; include Node test types for pure client module tests.

## Remaining release gates

Complete account verification/recovery, background services, notification delivery, full update installation/channel integration, automatic route interception/transit, privacy zones and the other matrix gaps. Verify PostGIS/containers, native signing/architecture/package validation, real physical permissions/background interruption, native import/share controls, accessibility and measured resource usage. Review platform SDK/store terms against AGPL before distributing binaries. No native, public release or production-readiness claim is justified yet.

## Git and publication

Work is recorded in Conventional Commits on local `testing`. `beta` and `main` are reserved bootstrap refs and have not received the app promotion. No temporary branch/worktree was used. No remote/push, release, distribution metadata publication or deployment occurred. The host's hardware-backed Git signing key was unavailable; commits used a command-local signing override without changing the user's Git configuration.

## UADS 36 follow-up — 2026-11-13

- Scope: Expo Router web entry, public guide, shared UI motion and contrast, iOS/web materials, Leaflet map lifecycle, and isolated X-Center staging configuration.
- Production web export and Chrome Playwright scenario passed. Checked desktop and mobile viewport widths, light and dark landing, keyboard disclosure with Reduced Motion, first visit, remembered entry, history, draft preservation, direct invitations, two independent accounts, live foreground delivery, revocation, Ideas and offline reload. The browser used synthetic GPS and a temporary SQLite database. External routing was disabled for this browser run.
- The browser exposed a map teardown error. The web adapter now disconnects its resize observer on teardown and fits live data without queuing animated camera moves. The repeated scenario completed with zero uncaught page errors.
- Type checking and 28 automated tests passed. Expo exported iOS and Android Hermes JavaScript bundles. Native binaries, simulator/emulator behavior, device permissions, iOS Glass and physical-device tracking remain unverified.
- X-Center staging is configured for private loopback services. The host and PostGIS container were unavailable for runtime validation. No release or deployment was performed.

## Public build workflow follow-up — 2026-11-14

GitHub Actions run 43507456006 passed validation, the unsigned iOS device IPA job and the iOS Simulator job. Both Android jobs failed during SDK setup, before compilation or signing: the setup action requested the obsolete SDK package `tools`. The matrix now uses the SDK provided by the GitHub Ubuntu runner. Signed Android artifacts require the Pathway release keystore secrets and a restricted Android Maps key. The manual checks in run 43507466837 passed.
