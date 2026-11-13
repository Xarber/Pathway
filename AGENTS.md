# Pathway agent entry point

Read `docs/INDEX.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/reports/VALIDATION.md` and `docs/IDEAS.json` before substantial work. The user's universal standards apply; project scope never authorizes unrelated features or public publication.

## Working rules

- Node 24, npm workspaces, Expo SDK 58. Match native dependencies using `npx expo install --check` in `apps/mobile`.
- Development happens on `testing` or isolated feature branches. Conventional Commits. Promote `testing → beta → main` only after channel-appropriate validation.
- No automatic full builds on testing. CI checks are manual. Beta/main build workflows do not publish releases; public source and X-Center web/API are authorized. Native artifact builds are authorized; store distribution and automatic releases remain separate.
- Preserve all unrelated edits. Never change signing identity, license or production infrastructure without authorization.
- Keep permission checks on the server. Room membership is not sharing consent. Never put precise coordinates in logs, URLs, analytics, push previews or ETA-only/coarse responses.
- Update relevant docs and the feature status matrix for meaningful changes. Never mark native verification from a web build.
- Run `npm run typecheck`, `npm test`, and the relevant export/build after a batch. `npm run test:browser` requires a production web export and an installed Chrome locally (Playwright Chromium in CI).
- Keep synthetic accounts/location samples in temporary test databases. Never seed production with them.

## Developer Ideas retrieval

`docs/IDEAS.json` is the repository collection; the initial collection is empty. At session start count new/considering, approved and deferred ideas, identify relevant or possibly implemented entries, and offer relevant items now or later without disrupting the explicit current task. Do not implement unrelated ideas without user selection. Link verified completion to commits and release metadata.

Private device-local Ideas are inaccessible until an authorized JSON export is supplied. Do not claim automatic synchronization. Use the versioned schema in `packages/shared/src/index.ts`. Review import conflicts before applying; preserve current records by default. Do not publish private exports.

## Modules

- `apps/mobile/src/components`: functional screens and platform map adapters.
- `apps/mobile/src/lib`: session/location lifecycle, native SQLite/browser storage, Ideas import logic.
- `apps/server/src/routes`: accounts, journeys, sharing, coordination and social modules.
- `apps/server/src/app.ts`: transport, transactions, authorization, viewer projections and cleanup.
- `packages/shared`, `packages/geospatial`, `packages/api-client`: contracts, calculations and transport.
- `infra`: initial SQL schema, PostGIS Compose, API container, optional routing and HTTPS examples.

No full plugin runtime is implemented. Provider and platform adapters are extension boundaries; preserve typed contracts rather than granting arbitrary code access to sensitive state.

## UADS section 36

- Keep the first-visit web introduction at `/` and preserve direct invitation links, browser history and drafts. Native launch goes straight to the app. See `docs/features/WEB_ENTRY.md`.
- Use X-Center by default. Follow `docs/XCENTER.md` for staging and preserve the established publication scope. Reuse the confirmed existing Pathway repository.
- Prefer configured hardware-backed commit signing. Use a command-local unsigned fallback if the key is unavailable and report it. Rewriting existing commits requires explicit authorization.
- Consult applicable design and motion skills, verify contrast and Reduced Motion, and test the changed interface in the browser and on available native targets.
