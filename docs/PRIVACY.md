# Privacy model

Pathway coordinates temporary meetings. Permanent tracking and automatic GPS history are absent. The privacy dashboard lists active grants, exact viewers, mode, expiry and last server fix; it separately shows foreground collector state and last successful delivery.

Friendship does not enable sharing. Only invited and accepted members can read a room. Grants allow selected viewers, and both directions of a block are checked on delivery. Invitation tokens are random, hashed at rest, expire, and are consumed once. Generic links expose no room details before an authenticated acceptance. Guest identities are not yet supported.

Live coordinates are ephemeral. Approximate data is reduced before storage. ETA-only origins are transient provider inputs and do not enter room payloads. No analytics SDK, address-book upload, advertising or public profile history is present. The app stores local room metadata for offline access but strips participant positions, messages, grants and proposals from that cache. Destination coordinates can still be sensitive; local metadata storage is not encrypted at rest on web, and device security matters.

Users can stop sharing, leave rooms, block people, remove participants, revoke outstanding invites, delete completed-room history or confirm password-protected account deletion. Organizer history deletion removes the completed room and messages for all members, with an explicit warning. Account deletion removes owned rooms, memberships, messages, proposals, reports involving that account and sessions. Backup deletion depends on instance policy.

Not yet implemented: private destination masking, privacy zones, end-to-end encryption, field-level database encryption, configurable retention UI, data portability exports, contact import, privacy-preserving discovery and a complete regulatory compliance audit. This development build is not advertised as compliant with a specific legal regime.
