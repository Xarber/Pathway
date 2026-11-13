# Web introduction and application entry

First visits to `/` render the product introduction in the static Expo export. It includes a real browser screenshot from an isolated QA account. The guide at `/guide` explains installation, privacy, native development and hosting. The installed PWA still launches at `/`.

Open App stores `pathway:web-opened` on the current browser origin. Existing sessions and invitation links open the app directly. The logo switches back to the introduction through a browser history entry on the root route. The app remains mounted, so form drafts, the selected tab and any active sharing session keep their state. The introduction itself does not load account data. If local storage is unavailable, the current page and its browser history still support switching between views. A fresh visit may show the introduction again.

The entry controller lives in `web-entry.web.tsx`. Native builds resolve the pass-through component and start directly in the app. The guide's native route returns to the app. Native and web still share the account, rooms, planner and design primitives.

Shared motion tokens give buttons 120 ms press feedback and disclosures a short fade. Reduced Motion removes press scaling and the entry transition, with opacity-only feedback for notifications. The web header uses a static blur with an opaque preference fallback. iOS checks for Liquid Glass support and respects reduced transparency. Android uses an opaque surface. Native motion and material rendering need device validation.
