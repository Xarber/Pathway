# Temporary location sharing

Membership is never consent. `POST /journeys/:id/sharing` operates only on the authenticated person's grant; an organizer cannot supply another owner. The request specifies precision, explicit current participant viewers, expiry, and independent `allowMeeting` permission. New participants are excluded until the owner renews their list.

## Modes

- Off: grant deleted.
- Manual: statuses/chat only, without location permission.
- ETA: only arrival time and source; coordinates are never accepted by the location endpoint in this mode. A route calculation may temporarily send an origin to the instance/provider, as disclosed in the UI. It is not persisted or returned to other people.
- Approximate: fixed latitude/longitude cells of 0.02 degrees. Only the cell center is persisted and delivered, with a minimum 1,600 m accuracy radius. Longitude widths shrink toward the poles. This reduces precision but is not differential privacy and does not conceal all possible sensitive inferences. A stationary point already exactly at a cell center can remain unchanged; the representation is nevertheless cell-level.
- Precise: validated latest fix including timestamp/accuracy; no path history.

Non-precise ETAs are rounded upward to five-minute intervals. Routing and manual sources remain separate. Route geometry is private to the requesting planner and is never included in room snapshots.

## Lifecycle

The app offers one-hour grants bounded by room expiry; the server caps grants at eight hours. Collector policy is foreground-only, 15-second platform interval / 30 m movement, with at least ten seconds between uploads. OS scheduling can differ. This is not a battery-adaptive/background engine. Approximate mode reduces coordinates on the client and again on the server. Loss of permission stops useful updates; errors are visible. On background transition the native subscription is removed. App restarts do not resume collection without explicit action.

Stop removes the local collector immediately, then revokes the server grant. Successful revocation deletes the fix, invalidates snapshots and notifies active sockets. If disconnected, the app cannot claim remote revocation succeeded; no fixes are queued, old points become stale and expiry remains enforced. Session logout, arrival, participant removal, expiry and completion revoke appropriate grants. Blocking filters both directions immediately.

A fix older than 60 seconds is marked stale; after five minutes it is absent. Invalid, future, old and out-of-order fixes are rejected. Previously viewed data or screenshots cannot be remotely erased. HTTPS protects transport; the server operator remains trusted.
