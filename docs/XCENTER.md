# X-Center staging

X-Center is Pathway's default hosting target. The private staging configuration runs the Expo export, Fastify API and PostGIS in a dedicated Compose project. The web and API ports bind to loopback, and PostGIS stays on the project network. The staging volume is separate from existing databases.

## Prepare a package

Run the manual [GitHub Actions workflow](../.github/workflows/xcenter-staging.yml) with the configured private HTTPS origin in `PATHWAY_STAGING_API_URL`. It tests the source and uploads the source archive, web export, manifest and checksum. For a local package from the current commit:

```sh
EXPO_PUBLIC_API_URL=https://private-staging-origin.example \
EXPO_PUBLIC_BUILD_COMMIT="$(git rev-parse HEAD)" npm run export:web
node scripts/xcenter-package.mjs
```

The workflow prepares artifacts. It has no X-Center credentials or deployment step. Verify the archive checksum before extracting it into a commit-specific directory. Place the matching exported web files in `apps/mobile/dist`. Copy `infra/xcenter/.env.example` to a private environment file, set a unique database password and record the exact staged commit. Preserve the previous package and image before staging a replacement.

## Run on the approved host

Check the loopback ports and the existing access-control and TLS setup before starting the project. Set the web build and CORS origin to the same private HTTPS origin. The proxy example is a loopback-only reference. An operator can adapt the existing X-Center proxy and TLS layer for the approved private origin.

```sh
docker compose --env-file /path/to/private-staging.env -f infra/xcenter/compose.yml config --quiet
docker compose --env-file /path/to/private-staging.env -f infra/xcenter/compose.yml up -d --build
curl --fail http://127.0.0.1:3181/health
curl --fail http://127.0.0.1:3180/
```

Verify the root landing, guide, PWA assets, API build commit, and an invitation and revocation flow over the private origin. Use the Compose health checks and inspect the targeted web and API logs for failures. Keep personal locations and credentials out of logs and backups. See [backup and rollback](DEPLOYMENT.md) for database handling. Restore the previous staging directory and API image on validation failure. Preserve the volume and avoid touching other projects.

The package and configuration are local deliverables. Host capacity, Compose runtime, private DNS, TLS and the deployment remain unverified.

## Public appliance

The public origin is [pathway.xcenter.it](https://pathway.xcenter.it). The deployment uses the appliance's existing Nginx and wildcard certificate. The dedicated Compose project runs PostGIS on its internal network and binds web/API only to loopback. API and authenticated WebSockets use the same HTTPS origin as the web app. The vhost disables access logs so invitation links and socket tickets are not captured there.

Build from a clean revision using Node 24:

```sh
npm ci
npm run build:server
EXPO_PUBLIC_API_URL=https://pathway.xcenter.it \
EXPO_PUBLIC_DISTRIBUTION=production \
EXPO_PUBLIC_BUILD_COMMIT="$(git rev-parse HEAD)" npm run export:web
node scripts/xcenter-package.mjs
```

Set `EXPO_PUBLIC_API_URL` to the public HTTPS origin in the appliance environment. This value is also embedded at export time and removes instance switching on web and native. `EXPO_PUBLIC_DISTRIBUTION=production` removes the Developer Options entry point. An unconfigured build retains self-hosted instance selection. Use the same values in GitHub Actions for native builds.

Copy the compiled API, production-only npm dependencies, root package.json, static web export and scripts/serve-web.mjs into a commit-specific release directory. Put the corresponding source archive in `web/source.tar.gz`. Keep the deployment environment file outside the release and set `PATHWAY_RELEASE_DIR`, `PATHWAY_DATA_DIR`, `BUILD_COMMIT` and a unique URL-safe `POSTGRES_PASSWORD`. With the application-specific environment and `infra/xcenter/production.yml`, run `docker compose config --quiet` and `docker compose up -d --wait`. Verify both loopback listeners, then install the provided Nginx vhost, run `nginx -t` and reload gracefully.

Verify the public URL, health commit, PWA and two-user browser flow with `PATHWAY_BROWSER_ORIGIN=https://pathway.xcenter.it npm run test:browser`. The deployed smoke test creates temporary accounts and deletes them when finished. Use synthetic locations only. Roll back by restoring the previous release directory and build commit in the environment, then recreating API and web. Preserve the database and keep database backups separate from source archives. On a first deploy, withdraw only Pathway's Nginx vhost if public validation fails.

Routing and search remain opt-in provider integrations. Configure dedicated, coverage-appropriate endpoints via `ROUTING_URL` and `GEOCODING_URL` before advertising their availability. The coordinate-based Journey Room workflow works without these providers.
