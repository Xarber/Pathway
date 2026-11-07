# Routing and meeting calculations

The Valhalla adapter accepts validated origins/destinations and maps walking → pedestrian, cycling → bicycle, driving → auto, scooter → bicycle with a visible limitation. Transit is rejected explicitly. It posts to `ROUTING_URL/route`, validates the response, decodes polyline6 geometry and returns provider distance/time/instructions. There is no straight-line or fabricated-time fallback.

Planner routes are returned only to their requester. Room ETA calculations transiently use an authorized user's submitted origin; only arrival, provenance and calculation time are persisted. Manual delays are added in minutes. ETA-only/coarse ETAs round up to five minutes. There is no traffic/GTFS realtime contract yet, and route estimates are not guaranteed arrival times.

Meeting proposals and organizer confirmation work independently of precise location. Optional comparison ranks up to three user-selected candidates for two to six fresh precise origins that the requester can already view, with separate per-grant `allowMeeting` consent. Objectives are total travel time, latest arrival, and a burden-balancing score. Missing routing results fail the calculation. Safety/accessibility is not automatically validated; output labels user-provided candidates and requires human confirmation. Comparison does not automatically create a public-place candidate set or implement moving-route interception.

Provider requests run outside SQL transactions. Final authorization rechecks membership, grants, expiry and blocks, so a concurrent stop-sharing action prevents late ETA/result publication. Inputs already sent to a trusted provider cannot be recalled.

One opt-in live-provider probe used public Rome landmarks and received a real route. Automated tests otherwise use clearly labelled test fixtures. No private GPS was sent. The public FOSSGIS demo is not the production default or an unlimited SLA. Official guidance: [Valhalla](https://valhalla.github.io/valhalla/), [scripted container](https://github.com/valhalla/valhalla/blob/master/docker/README.md).
