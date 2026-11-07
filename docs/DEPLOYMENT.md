# Self-hosting and rollback

The API and production web export can be self-hosted; native binaries connect to a compatible instance selected in Settings. The operator is trusted with credentials and explicitly shared data. Only API v1 is accepted by the client. No hosted server was deployed in this session.

## Compose

```sh
cp .env.example .env
# Replace database password, CORS origins, provider URLs and BUILD_COMMIT.
docker compose --env-file .env -f infra/compose.yml config
docker compose --env-file .env -f infra/compose.yml up -d --build db api
curl --fail http://127.0.0.1:3001/health
```

The API image migrates the initial schema at startup. PostgreSQL/PostGIS has a persistent named volume and local-only port. The API runs as a non-root user, with a read-only root filesystem, healthcheck, resource limit and restart policy. Redis is unnecessary for the current single-process service. Do not start multiple API replicas.

The optional `routing` profile uses the official Valhalla scripted image. Place a licensed regional extract in `infra/routing-data`, then:

```sh
docker compose --env-file .env -f infra/compose.yml --profile routing up -d routing
```

Set ROUTING_URL to `http://routing:8002` for the container API and recreate only that service after configuration. Production operators should pin the reviewed routing image digest; the optional example default is a mutable latest tag. Geocoding and tiles are independent services, with separate data/licensing/resource requirements. They are not made free merely by running this API.

## Web and TLS

Build with the intended HTTPS API origin:

```sh
EXPO_PUBLIC_API_URL=https://pathway.example.org npm run export:web
```

Serve `apps/mobile/dist` with HTTPS and SPA/static-route fallback. `infra/Caddyfile.example` illustrates a single-origin installation and WebSocket-capable proxy. Do not log Authorization, invitation tokens or location request bodies at the proxy. Keep sw.js revalidated; never cache API responses. Tune trusted proxy/rate limits deliberately. The example is not a claim that a production domain was configured or tested.

## Backup and deploy procedure

Record the currently deployed version/commit, retain the current web directory and API image, and take a controlled database backup before changes:

```sh
docker compose --env-file .env -f infra/compose.yml exec -T db pg_dump -U pathway -d pathway -Fc > pathway-backup.dump
```

Backups contain sensitive data; encrypt them, restrict access and set explicit expiry. Restoring/overwriting a database is destructive and requires a separately authorized recovery plan. Never delete the volume as cleanup.

Stage new artifacts separately. Validate configuration, database migration compatibility, API capabilities and health, then atomically switch the web directory/proxy and targeted API image. Verify public version/commit and an actual two-user socket/consent/revocation flow. Roll back the web symlink/API image on critical failure; schema rollback must be planned before applying a migration. Do not restart unrelated services. Docker/PostGIS and public TLS deployment were unavailable for live validation here.
