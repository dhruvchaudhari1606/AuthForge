# AuthForge --- Docker and Infrastructure

## 1. Goal

Local development should be reproducible with Docker.

Core services:

``` text
authforge-api
postgres
redis
```

Optional:

``` text
mail-worker
mail testing service
```

Only include optional services if the code actually uses them.

## 2. Docker Compose

Conceptual topology:

``` text
                 ┌───────────────┐
                 │ AuthForge API │
                 └───────┬───────┘
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        PostgreSQL                Redis
```

## 3. PostgreSQL

Use a supported PostgreSQL image.

Requirements:

-   persistent volume
-   health check
-   non-public port where possible
-   environment-based credentials
-   database initialization

Do not commit production credentials.

## 4. Redis

Requirements:

-   persistent volume only if the chosen use cases require it
-   health check
-   restricted network
-   authentication if deployment requires it

Do not expose Redis publicly in production.

## 5. Application Dockerfile

Prefer multi-stage builds:

``` text
dependencies
→ build
→ production runtime
```

Benefits:

-   smaller runtime
-   fewer build tools
-   clearer production image

## 6. Runtime

Use a supported Node.js LTS version.

The application should:

-   run as a non-root user where practical
-   receive configuration from environment
-   handle SIGTERM
-   close database/Redis connections gracefully

## 7. Health Checks

Expose:

``` http
GET /health
```

Separate:

-   liveness
-   readiness

Readiness should verify required dependencies where appropriate.

## 8. Docker Environment

Example:

``` env
NODE_ENV=development
PORT=3000

DATABASE_HOST=postgres
DATABASE_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
```

Do not use `localhost` from inside the API container to reach
PostgreSQL/Redis.

## 9. Networking

Compose services can communicate using service names:

``` text
postgres
redis
```

Keep databases on internal networks where possible.

## 10. Volumes

Development:

``` text
postgres_data
```

Redis persistence depends on use case.

Never assume a development volume is a production backup.

## 11. Startup Ordering

`depends_on` alone does not prove a dependency is ready.

Use health checks and application retry/startup behavior.

## 12. Database Migrations

Production startup should not blindly run destructive schema
synchronization.

Recommended:

``` text
build image
→ deploy
→ migration step
→ start application
```

The exact process depends on deployment platform.

## 13. Logging

Containers should write logs to stdout/stderr.

The platform should collect them.

Do not create uncontrolled log files inside ephemeral containers.

## 14. Secrets

Do not bake secrets into:

-   Dockerfile
-   image layers
-   source code
-   docker-compose committed production config

Use:

-   environment variables locally
-   secret manager/CI secret store in deployment

## 15. Local Developer Commands

Typical:

``` bash
docker compose up -d
docker compose ps
docker compose logs -f api
docker compose down
docker compose down -v
```

`down -v` destroys local database volumes and should be used
intentionally.

## 16. Production Hardening

Production should additionally consider:

-   HTTPS termination
-   private database
-   private Redis
-   firewall/network controls
-   backups
-   monitoring
-   resource limits
-   restart policies
-   non-root container
-   image scanning
-   secret management

## 17. Definition of Done

Infrastructure is complete when:

-   one documented command starts local dependencies
-   API connects to PostgreSQL
-   API connects to Redis
-   health checks work
-   migrations work
-   logs are observable
-   no secrets are baked into images
-   graceful shutdown works
