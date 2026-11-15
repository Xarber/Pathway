# Active Pathway tasks

Process in creation order. Resume blocked work when its dependency becomes available. Use isolated databases for synthetic tests.

| Order and ID | Scope and priority | State | Evidence and next action |
|---|---|---|---|
| 1 PW-001 | Publish web and API to X-Center, high | Blocked | Appliance Compose and Nginx prepared in 17deb8c. Restore access, verify existing container/data state, stage the release and validate HTTPS, readiness and WebSockets before public verification. |
| 2 PW-002 | Public source and native builds, high | Blocked | Source is public. SDK correction 16f1a50. Run 43584908973 built both iOS artifacts. Android reached signing and requires the existing keystore secrets and restricted Maps key. Validate install and runtime independently. |
| 3 PW-003 | UADS compliance baseline, high | Implemented | Validate manifest and evidence paths, run source checks and dispatch the quality workflow. Track missing coverage, security and native evidence independently. |
| 4 PW-004 | Onboarding, genuine screenshot variants and isolated sample tooling, normal | Queued | Extend the existing introduction without disrupting invitation entry. Reuse browser fixture flows and separately capture verified native assets. |
| 5 PW-005 | Production diagnostics and server switching, high | Queued | Reuse session origin binding. Add fail-closed production configuration and independently test credential isolation across explicit overrides. |
| 6 PW-006 | Live landing installation hub and release synchronization, normal | Queued | Verify PWA controls and discover only supported published assets. Native publication remains outside current authorization. |
| 7 PW-007 | Quality measurements and X-Center operational evidence, high | Queued | Establish changed-code coverage and accessibility evidence, then verify budgets, backups, restore and monitoring against the target. Depends on PW-001 for live measurements. |
