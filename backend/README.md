# BookMyVenue — Backend

The Go API server for [BookMyVenue](../README.md). It handles authentication,
venue onboarding, pricing, and bookings.

## Tech Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Language       | Go 1.25                                             |
| HTTP framework | [Gin](https://github.com/gin-gonic/gin)             |
| Database       | PostgreSQL 16 + [PostGIS](https://postgis.net/)     |
| DB driver      | [pgx/v5](https://github.com/jackc/pgx)              |
| Migrations     | [golang-migrate](https://github.com/golang-migrate/migrate) (embedded, auto-run) |
| Cache / tokens | Redis 7                                             |
| Auth           | JWT (Ed25519) — short-lived access + refresh tokens |
| API docs       | [Swagger / swaggo](https://github.com/swaggo/swag)  |

## Prerequisites

- Go 1.25+
- Docker + Docker Compose (for Postgres and Redis)
- `make` (optional, but the targets below assume it)

## Configuration

Configuration is read from environment variables (see
[`internal/config/config.go`](internal/config/config.go)). Create a `.env` file
in this directory:

```env
# --- Required ---
DATABASE_URL=postgresql://postgresforbookmyvenue:postgresforvenuepassword@localhost:5454/nithul-bookmyvenue
REDIS_URL=redis://localhost:6341
ENCRYPTION_KEY=<64 hex characters (32 bytes)>
JWT_PRIVATE_KEY=<base64-encoded Ed25519 private key>
JWT_PUBLIC_KEY=<base64-encoded Ed25519 public key>

# --- Optional (defaults shown) ---
HOST=0.0.0.0
PORT=8081
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> `ALLOWED_ORIGINS` is a comma-separated list of frontend origins permitted by
> CORS. Add your frontend's dev URL here if it differs from the defaults.

## Getting Started

```bash
# 1. Start Postgres (PostGIS) and Redis
make up            # docker compose up -d venue-db venue-cache

# 2. Run the server (migrations apply automatically on startup)
make run           # go run ./cmd/server/

# Stop the containers
make down
```

The server listens on `http://localhost:8081` by default.

- Health check: `GET /health`
- Swagger UI: `http://localhost:8081/swagger/index.html`

## Database & Migrations

Migrations live in
[`internal/repository/migrations/`](internal/repository/migrations/) and are
**embedded into the binary** (`//go:embed`) and applied automatically on every
startup by `repository.RunMigrations`. Already-applied migrations are skipped, so
startup is idempotent and a fresh database self-heals.

To add a new migration, create a matching up/down pair following the existing
numbering:

```
internal/repository/migrations/006_<name>.up.sql
internal/repository/migrations/006_<name>.down.sql
```

> **Note:** The venue table uses `GEOGRAPHY(Point, 4326)`, which requires the
> **PostGIS** extension. The Docker image (`postgis/postgis`) provides it, and
> the migration enables it with `CREATE EXTENSION IF NOT EXISTS postgis`. A plain
> `postgres` image will not work.

## Project Structure

```
backend/
├── cmd/server/            # main entrypoint
├── internal/
│   ├── config/            # env-based configuration loading
│   ├── handler/           # HTTP server, routes, request handlers
│   ├── middlewares/       # auth, CORS, request ID, logging
│   ├── repository/        # DB/Redis access + embedded migrations
│   ├── services/          # business logic (auth, etc.)
│   └── domain/            # core types and roles
├── docs/                  # generated Swagger spec
├── pkg/logger/            # logging setup
└── docker-compose.yml     # Postgres (PostGIS) + Redis
```

## Recent Changes

The following changes were made to get end-to-end sign-up working:

### 1. CORS support (fixes "CORS Missing Allow Origin" on sign-up)
The frontend (a different origin) was blocked because the server sent no CORS
headers and did not answer preflight `OPTIONS` requests.
- Added [`internal/middlewares/cors.go`](internal/middlewares/cors.go) — reflects
  allowed origins, enables credentials (for refresh tokens), and short-circuits
  preflight `OPTIONS` with `204`.
- Registered it first in the middleware chain in
  [`internal/handler/routes.go`](internal/handler/routes.go).
- Added an `AllowedOrigins` config field, populated from `ALLOWED_ORIGINS`
  (defaults to `localhost:5173` and `localhost:3000`) in
  [`internal/config/config.go`](internal/config/config.go).

### 2. Automatic database migrations (fixes `relation "users" does not exist`)
The schema SQL files were never applied — nothing ran them on startup.
- Added [`internal/repository/migrate.go`](internal/repository/migrate.go) —
  embeds the SQL files and runs pending migrations via golang-migrate's pgx/v5
  driver on startup.
- Wired `repository.RunMigrations` into
  [`cmd/server/main.go`](cmd/server/main.go) right after the DB connects.
- Moved the SQL files into
  [`internal/repository/migrations/`](internal/repository/migrations/) (embed
  cannot reach parent directories), renamed to golang-migrate's
  `NNN_name.up.sql` convention, and added matching `.down.sql` files.

### 3. Migration bug fixes (would otherwise crash startup)
- Fixed `CREATE EXTENTION` → `CREATE EXTENSION` in the venue_pricing migration.
- Added `CREATE EXTENSION IF NOT EXISTS postgis;` to the venue migration (it uses
  the `GEOGRAPHY` type).
- Switched the DB image in [`docker-compose.yml`](docker-compose.yml) from
  `postgres:16-alpine` to `postgis/postgis:16-3.4-alpine`.
