# Journey Rooms

The organizer creates a scheduled room with title, destination, transport and bounded expiry. The organizer may start, edit, complete/cancel, invite, remove participants and confirm proposed meeting points. A participant can independently set status/mode/delay, propose a point, send messages, share with selected viewers, arrive, or leave. Organizer and participant roles are implemented; delegated organizers and guests are not.

Invitations can target a username or be single-use bearer tokens. Recipients explicitly accept or decline. New membership always starts with sharing off. A room accepts at most twenty members. Completion/cancellation clears grants, fixes, ETAs and outstanding invitations. Rooms expire automatically.

Statuses include accepted, preparing, departed, en route, delayed, near meeting, arrived and paused. Manual arrival removes that participant's grant. Group arrival is the latest nonstale available ETA, explicitly partial if anyone is unknown. It is not an invented all-participants arrival estimate. Arrival confirmation is manual; the pure geofence/dwell classifier is tested but not integrated into native services.

The screen exposes map/list alternatives, current mode, timestamps/accuracy, chosen viewers, quick messages, text chat, manual and route-calculated ETA, proposed/confirmed points and organizer controls. Chat is capped to the latest 100 messages per snapshot, not a full messaging platform. Destination changes invalidate ETAs. Automatic rerouting, deadlines, grouped-travel confirmation and route interception remain outstanding.
