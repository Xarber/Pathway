# Third-party notices and release review

Original Pathway code: AGPL-3.0-only, Copyright 2026 OpenRecode contributors. Complete license text is in LICENSE. Third-party packages retain their own copyright/license; this file is not a replacement for upstream notices.

| Component | Installed version at initial build | License / review |
|---|---|---|
| Expo / Expo Router | 58.0.23 / 58.0.30 | MIT |
| React / React Native | 19.3.0 / 0.88.1 | MIT |
| react-native-maps | 1.29.11 | MIT wrapper; native platform SDK terms are separate |
| Leaflet | 1.9.4 | BSD-2-Clause |
| Fastify | 5.12.8 | MIT |
| node-postgres | 8.23.1 | MIT |
| Zod | 4.6.7 | MIT |
| TanStack Query | 5.106.1 | MIT |
| Expo vector icons | 15.1.1 | MIT package; bundled icon/font licenses must be retained |
| OpenStreetMap data | Provider-dependent snapshot | ODbL and attribution obligations |
| Valhalla / PostgreSQL / PostGIS | Operator-selected | Separate MIT / PostgreSQL / GPL terms respectively |

This is an initial direct-dependency review, not an exhaustive transitive/legal clearance. Native Apple/Google map SDK terms, proprietary service conditions, App Store distribution conditions and AGPL source availability require a specific compatibility review before distributing those binaries. No store compatibility is claimed. Hosting the API does not grant tile redistribution rights. Network deployments must provide the Corresponding Source required by AGPL for the actual deployed version. The codebase intentionally contains no publicly activated source endpoint until publication scope is authorized.
