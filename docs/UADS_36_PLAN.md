# UADS 36 implementation plan — 2026-11-13

Scope: apply the newly added section 36 from `/Users/xarber/.codex/AGENTS.md`, preserving the already implemented app. Existing sections 1–35 remain in effect; this is not a claim that the outstanding full product roadmap is complete.

1. Keep the existing Expo/Fastify repository. Integrate the first-visit landing at `/`, remember app entry, preserve drafts on logo return and keep native startup direct. Add a readable `/guide` page with actual QA browser screenshots, platform/install status, privacy/license and links into the functional app.
2. Add shared, accessible motion tokens/provider: 120 ms press feedback, 180 ms disclosure fade, 200 ms occasional feedback. Keep tab switches immediate and measured location data stationary. Support runtime Reduced Motion, reduced transparency and contrast preferences; no animation delays the action.
3. Apply meaningful section/category/status icons, readable secondary text and theme-safe destructive colors. Add supported Apple glass chrome with opaque fallbacks only if compatible APIs exist in the installed SDK; never claim physical validation from web checks.
4. Make X-Center the documented deployment target and prepare an isolated staging configuration and manual deployment workflow. Do not change live infrastructure, activate a public hostname, create duplicate repositories or publish private app data. Existing explicit no-public-deployment constraints persist.
5. Preserve hardware signing configuration. Probe the configured key during the actual commit; if unavailable, commit unsigned using a command-local override. Never re-sign history without explicit permission.
6. Run relevant unit/type checks, two-client browser regression, landing navigation/layout/light-dark/reduced-motion checks and platform JS exports. Record scope and unavailable native/container/deployment validation in an addendum report.

Acceptance: first visits to `/` show the landing and repeat visits open the app; installation links are honest about missing binaries; documentation is directly readable; the existing invitation/sharing/revocation flow still passes; Reduced Motion removes translation/scale; keyboard/touch controls remain available; deploy configuration is staged and recoverable with no unrelated restarts.

Repository Ideas: 0 new/considering, 0 approved, 0 deferred. No private device collection was accessed. No unrelated Ideas are being implemented.
