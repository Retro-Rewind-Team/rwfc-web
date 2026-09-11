# Retro Rewind Website

A full-stack web application for Retro Rewind. Provides a competitive VR leaderboard, time trial rankings with ghost file management, a live RWFC room browser, and per-player race statistics.

This README is aimed at developers setting up the project locally for development and collaboration.

---

## Table of Contents

- [Overview](#overview)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Testing](#testing)
- [Configuration Reference](#configuration-reference)
- [Background Services](#background-services)
- [API Reference](#api-reference)
- [Health Checks](#health-checks)
- [Track Sync Tool](#track-sync-tool)
- [Things That Look Wrong But Are Not](#things-that-look-wrong-but-are-not)

---

## Overview

| Layer | Stack |
|---|---|
| Frontend | Solid.js, TypeScript, Tailwind CSS v4, Vite |
| Backend | ASP.NET Core .NET 10, EF Core, PostgreSQL |
| Tests | xUnit v3 on Microsoft.Testing.Platform, Vitest with jsdom |
| API docs | Scalar (available in development at `/scalar`) |

The frontend and backend run as separate processes. In development the frontend calls the backend directly via the `VITE_API_URL` environment variable. There is **no** Vite proxy.

---

## Repository Layout

| Path | What it is |
|---|---|
| `Backend/` | ASP.NET Core API. Contains both a `.sln` and a `.csproj`. |
| `Backend.Tests/` | xUnit v3 tests, split into `Unit/` and `Integration/`. |
| `Frontend/` | Solid.js single-page app. |
| `Tools/TrackSync/` | CLI that syncs the track catalogue from a CSV into the database. See [Track Sync Tool](#track-sync-tool). |
| `Tools/TrackSync.Tests/` | Tests for the pure parts of TrackSync. |
| `global.json` | Selects Microsoft.Testing.Platform as the `dotnet test` runner. Do not remove; see [Testing](#testing). |

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [PostgreSQL](https://www.postgresql.org/download/) (v15 or later)
- [pgAdmin](https://www.pgadmin.org/) (optional but recommended, GUI for managing the local database)
- [EF Core CLI tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet) — install once globally:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

---

## Backend Setup

All commands run from `Backend/`.

### 1. Create the database

The default development connection string expects a local PostgreSQL instance:

```
Host=localhost;Database=rr_dev;Username=postgres;Password=postgres
```

Create the database using psql or pgAdmin. With psql:

```bash
psql -U postgres -c "CREATE DATABASE rr_dev;"
```

If your local PostgreSQL uses different credentials, update them in `appsettings.Development.json` (see step 2).

### 2. Create `appsettings.Development.json`

This file is not included in the repository (it is gitignored). Create it at `Backend/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=rr_dev;Username=postgres;Password=postgres"
  },
  "WfcSecret": "key"
}
```

- You only need the connection string if your local PostgreSQL uses different credentials. Otherwise the value in `appsettings.json` is used.
- `WfcSecret` is the Bearer token required by `/api/moderation/*` endpoints. `"key"` is fine locally.

### 3. Run the API

NuGet packages are restored automatically on first build. No separate install step is needed.

```bash
dotnet run
```

Migrations are applied automatically on startup. The API listens on `https://localhost:7084` and `http://localhost:5092` by default (see `Backend/Properties/launchSettings.json`).

### 4. Verify migrations (optional)

```bash
dotnet ef migrations list
```

Applied migrations are marked `[applied]`. Unmarked ones are pending and will be applied the next time the app starts, or manually with `dotnet ef database update`.

### Useful backend commands

`Backend/` holds both a `.sln` and a `.csproj`, so `dotnet format` cannot work out which to use and fails with *"Both a MSBuild project file and solution file found"*. Always name the project:

```bash
dotnet build                                                # Build
dotnet format RetroRewindWebsite.csproj                     # Auto-fix formatting (respects .editorconfig)
dotnet format RetroRewindWebsite.csproj --verify-no-changes # Check formatting without modifying files
dotnet ef migrations add <Name>                             # Create a new EF Core migration
dotnet ef migrations remove                                 # Remove the last migration
dotnet ef database update                                   # Apply pending migrations
```

Auto-generated migration files are committed with a UTF-8 BOM and will always be reported by the formatter's `CHARSET` rule. That is expected; ignore those entries and act only on findings in hand-written files.

---

## Frontend Setup

All commands run from `Frontend/`.

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.development`

This file is not included in the repository (it is gitignored). Create it at `Frontend/.env.development`:

```
VITE_API_URL=https://localhost:7084/api
```

Update the URL if your backend runs on a different port. There is no proxy, so this must point at the backend's own origin.

### 3. Start the dev server

```bash
npm run dev
```

The dev server runs on `http://localhost:3000`.

### Useful frontend commands

```bash
npm run dev            # Start dev server
npm run build          # Type-check, bundle, then run the postbuild meta step
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run format         # Format all source files with Prettier
npm run format:check   # Check formatting without modifying files (CI-safe)
npm run type-check     # TypeScript check without emitting files
```

`npm run build` runs a `postbuild` step (`scripts/generate-meta.mjs`, then `scripts/verify-meta.mjs`) that writes per-route `<title>` and `<meta>` tags into the built output from `src/constants/pageMeta.json`, then asserts they landed. A build can therefore fail *after* Vite reports success; if that happens, the fault is in the meta step, not the bundle.

---

## Testing

### Frontend

Tests use [Vitest](https://vitest.dev/) and live in `Frontend/src/__tests__/`, mirroring the `src/` layout: `components/`, `hooks/`, `services/`, `constants/`, `utils/`. They run under **jsdom** with a setup file that cleans up between renders, so component and hook tests work alongside the pure utility ones. No server or database is required.

```bash
# Run from Frontend/
npm test                # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Backend

Tests use [xUnit v3](https://xunit.net/) on [Microsoft.Testing.Platform](https://learn.microsoft.com/dotnet/core/testing/microsoft-testing-platform-intro) and live in `Backend.Tests/`.

The `global.json` at the repository root selects that runner:

```json
{
    "test": {
        "runner": "Microsoft.Testing.Platform"
    }
}
```

**Without it `dotnet test` fails outright** on the .NET 10 SDK with *"Testing with VSTest target is no longer supported"*. If you hit that error, check `global.json` is present and that you are running from the repository root.

**Unit tests** cover helpers, filters, domain services and mappers. No database required.

```bash
dotnet test Backend.Tests/RetroRewindWebsite.Tests.csproj --filter "Category=Unit"
```

**Integration tests** cover controllers and repositories end-to-end via `WebApplicationFactory`, against a real PostgreSQL `rr_test` database that is created automatically on first run.

```bash
dotnet test Backend.Tests/RetroRewindWebsite.Tests.csproj --filter "Category=Integration"
```

**Run everything:**

```bash
dotnet test Backend.Tests/RetroRewindWebsite.Tests.csproj
```

**With coverage** (uses `Microsoft.Testing.Extensions.CodeCoverage`; the older VSTest `--collect:"XPlat Code Coverage"` does not work under this runner):

```bash
dotnet test Backend.Tests/RetroRewindWebsite.Tests.csproj --coverage
```

Every test class carries a `[Trait("Category", ...)]` of `Unit` or `Integration`. A class without one is invisible to both filters while still running in the unfiltered pass, so add the trait when writing a new test class.

The integration tests connect to `rr_test` using the same credentials as `rr_dev` by default. Override with the `RR_TEST_CONNECTION_STRING` environment variable.

> **The integration tests truncate what they connect to.** The fixture runs `TRUNCATE TABLE "Players" CASCADE` before seeding. It refuses to run if the resolved database name is not the configured test database, but do not point `RR_TEST_CONNECTION_STRING` at anything you care about.

### Track Sync tests

```bash
dotnet test Tools/TrackSync.Tests/TrackSync.Tests.csproj
```

---

## Configuration Reference

### Backend

| Setting | Source | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | `appsettings.json` / `appsettings.Development.json` | PostgreSQL connection string (development) |
| `CONNECTION_STRING` | Environment variable | PostgreSQL connection string (production) |
| `ConnectionStrings:Production` | `appsettings.Production.json` | Fallback used when `CONNECTION_STRING` is unset |
| `WfcSecret` | `appsettings.Development.json` | Bearer token for moderation endpoints (development) |
| `WFC_SECRET` | Environment variable | Bearer token for moderation endpoints (production) |
| `WFC_GROUPS_ENDPOINT` | Environment variable | Full URL to query active room groups from |
| `WFC_RACE_RESULTS_ENDPOINT` | Environment variable | Full URL to query completed race results from |
| `WFC_PCOUNT_ENDPOINT` | Environment variable | Full URL to query the online player count from |
| `Discord:AutoFlagWebhookUrl` | `appsettings.*.json` | Discord webhook posted to when a player is auto-flagged. Alerts are queued and drained by a background service, never awaited inline. |
| `RaceStatsCache:GlobalSeconds` | `appsettings.*.json` | Cache lifetime for global race statistics. Default 300; `0` disables caching. |
| `RaceStatsCache:PlayerSeconds` | `appsettings.*.json` | Cache lifetime for per-player race statistics. Default 120; `0` disables caching. |

The connection pool is deliberately capped at `MaxPoolSize=10`. The production host has four threads, and a single request uses one connection at a time. Raising it buys contention, not throughput.

### Frontend

| Setting | File | Description |
|---|---|---|
| `VITE_API_URL` | `.env.development` / `.env.production` | Base URL for all API calls. Defaults to `/api` if unset. |

---

## Background Services

Five background services run automatically when the API starts. The four polling ones use a shared `PollingBackgroundService` base class that guards each cycle with a semaphore, so a slow run is skipped rather than overlapped.

| Service | Interval | What it does |
|---|---|---|
| **LeaderboardBackgroundService** | 1 min | Fetches active WFC room groups, upserts players, tracks VR history, recalculates rankings and VR gains |
| **RoomStatusBackgroundService** | 10 s | Refreshes live room data; persists a snapshot every 6th tick, so snapshot history is one row per minute |
| **RaceResultBackgroundService** | 1 min | Polls WFC for completed race results and persists them |
| **MiiPreFetchBackgroundService** | 30 min | Caches Mii avatars for players without a fresh cache entry. Waits out an initial delay before its first run. |
| **DiscordAlertBackgroundService** | on demand | Drains the auto-flag alert queue. Not a poller: it waits on a channel, so an unreachable Discord delays notifications only, never the sync that raised them. |

Mii images are rendered by calling Nintendo's Mii Studio directly (`studio.mii.nintendo.com`) with the Mii data decoded from the player record. Results are cached in the `PlayerMiiCaches` table and in memory, refreshed every 7 days.

---

## API Reference

Scalar API documentation is available at `/scalar` in development. The raw OpenAPI spec is served at `/openapi/v1.json`.

### Auth

All endpoints are public except `/api/moderation/*`, which requires:

```
Authorization: Bearer <WfcSecret>
```

### Errors

Unhandled exceptions are turned into a `500` by a single global exception filter, which logs the action name along with the request's route and query values. The response body is deliberately generic:

```json
{ "error": "An unexpected error occurred" }
```

Controllers do not carry their own try/catch for this. A client that disconnects mid-request is recorded at debug rather than as an error, since there is nobody left to receive a response.

### Rate limits

Rate limiting is handled by Cloudflare in front of the origin, not by the API.

The application previously ran its own per-IP limiter. It was removed because the API sits behind both Cloudflare **and** nginx, so the address the app sees is nginx's and every client partitioned to the same bucket, giving one shared limit for all users rather than one each. Reintroducing an in-process limiter requires resolving the real client first, via `CF-Connecting-IP` and trusting only the immediate proxy.

### Key endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/leaderboard` | Paginated VR leaderboard |
| `GET` | `/api/leaderboard/player/{fc}` | Single player profile |
| `GET` | `/api/leaderboard/player/{fc}/history` | VR history over time |
| `GET` | `/api/leaderboard/player/{fc}/mii` | Mii avatar (base64) |
| `GET` | `/api/leaderboard/player/{fc}/mii/image` | Mii avatar (PNG) |
| `POST` | `/api/leaderboard/miis/batch` | Mii avatars for many friend codes at once |
| `GET` | `/api/badges/by-pid/{pid}` | Badges held by one player |
| `POST` | `/api/badges/by-pids` | Badges for many players at once (capped per request) |
| `GET` | `/api/roomstatus` | Current live room snapshot |
| `GET` | `/api/roomstatus/history` | Paginated snapshot history (range capped at 31 days) |
| `GET` | `/api/timetrial` | Time trial leaderboard |
| `GET` | `/api/timetrial/tracks` | All tracks |
| `GET` | `/api/racestats/player/{pid}` | Per-player race statistics |
| `GET` | `/api/racestats/global` | Global race statistics |
| `GET` | `/api/multiplier` | Active VR multipliers |
| `POST` | `/api/moderation/flag` | Flag a player as suspicious |
| `POST` | `/api/moderation/unflag` | Unflag a player |
| `POST` | `/api/moderation/timetrial/submit` | Submit a ghost file |
| `POST` | `/api/moderation/multiplier` | Create a VR multiplier |

---

## Health Checks

| Endpoint | What it checks |
|---|---|
| `/api/health` | Full report: database, Retro WFC API, memory |
| `/api/health/live` | Liveness probe (always 200 if the process is up) |
| `/api/health/ready` | Readiness probe (all checks must pass) |

The database check runs through the shared EF data source rather than opening its own connection, so it costs nothing from the pool. The WFC check calls the player-count endpoint deliberately, bypassing its cache: a health check that reads a cache tests nothing.

---

## Track Sync Tool

`Tools/TrackSync` syncs the track catalogue from a Pulsar CSV into the database. It writes a JSON backup before applying anything, and can restore from one.

```bash
# Preview and apply a sync. Prints a diff and asks for confirmation before writing.
dotnet run --project Tools/TrackSync -- <csv-path> --update-time "YYYY-MM-DD HH:MM:SS" [--connection <conn-str>] [--allow-warnings]

# Restore from a backup written by a previous run.
dotnet run --project Tools/TrackSync -- --restore <backup-path> [--connection <conn-str>]
```

`CONNECTION_STRING` is used when `--connection` is not given.

**`--allow-warnings` exists for one specific case.** If several tracks share an old `CourseId` but the CSV maps them to different new ones, the sync stops. Applying that would move race history onto the wrong track. Check each warning before overriding it.

`--update-time` bounds which `RaceResults` rows get their `CourseId` remapped. If the tool reports that 0 rows would be updated, that is usually a sign the timestamp is wrong or in the future.
