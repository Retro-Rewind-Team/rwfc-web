# Retro Rewind Website

A full-stack web application for Retro Rewind. Provides a competitive VR leaderboard, time trial rankings with ghost file management, a live RWFC room browser, and per-player race statistics.

This README is aimed at developers setting up the project locally for development and collaboration.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Configuration Reference](#configuration-reference)
- [Background Services](#background-services)
- [API Reference](#api-reference)
- [Health Checks](#health-checks)

---

## Overview

| Layer | Stack |
|---|---|
| Frontend | Solid.js, TypeScript, Tailwind CSS v4, Vite |
| Backend | ASP.NET Core .NET 10, EF Core, PostgreSQL |
| API docs | Scalar (available in development at `/scalar`) |

The frontend and backend run as separate processes. In development the frontend calls the backend directly via the `VITE_API_URL` environment variable.

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [PostgreSQL](https://www.postgresql.org/download/) (v15 or later)
- [pgAdmin](https://www.pgadmin.org/) (optional but recommended, GUI for managing the local database)
- [EF Core CLI tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet)  install once globally:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

---

## Backend Setup

All commands run from `Backend/RetroRewindWebsite/`.

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

This file is not included in the repository (it is gitignored). Create it at `Backend/RetroRewindWebsite/appsettings.Development.json` with the following content:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=rr_dev;Username=postgres;Password=postgres"
  },
  "WfcSecret": "key"
}
```

- You only need to add the connection string if your local PostgreSQL uses different credentials.
- `WfcSecret` is the Bearer token required by `/api/moderation/*` endpoints. The value `"key"` is fine for local development.

### 3. Run the API

NuGet packages are restored automatically on first build. No separate install step is needed.

```bash
dotnet run
```

Migrations are applied automatically on startup. The API listens on `https://localhost:7084` and `http://localhost:5084` by default.

### 4. Verify migrations (optional)

To check whether all migrations have been applied to your local database:

```bash
dotnet ef migrations list
```

Applied migrations are marked with `[applied]`. Any unmarked migrations are pending and will be applied the next time the app starts (or you can apply them manually with `dotnet ef database update`).

### Useful backend commands

```bash
dotnet build                          # Build
dotnet format                         # Auto-fix formatting (respects .editorconfig)
dotnet format --verify-no-changes     # Check formatting without modifying files
dotnet ef migrations add <Name>       # Create a new EF Core migration
dotnet ef migrations remove           # Remove the last migration
dotnet ef database update             # Apply pending migrations
```

---

## Frontend Setup

All commands run from `Frontend/`.

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.development`

This file is not included in the repository (it is gitignored). Create it at `Frontend/.env.development` with the following content:

```
VITE_API_URL=https://localhost:7084/api
```

Update the URL if your backend runs on a different port.

### 3. Start the dev server

```bash
npm run dev
```

The dev server runs on `http://localhost:3000`.

### Useful frontend commands

```bash
npm run dev            # Start dev server
npm run build          # Type-check + build for production
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run format         # Format all source files with Prettier
npm run format:check   # Check formatting without modifying files (CI-safe)
npm run type-check     # TypeScript check without emitting files
```

---

## Configuration Reference

### Backend

| Setting | Source | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | `appsettings.Development.json` | PostgreSQL connection string (development) |
| `CONNECTION_STRING` | Environment variable | PostgreSQL connection string (production) |
| `WfcSecret` | `appsettings.Development.json` | Bearer token for moderation endpoints (development) |
| `WFC_SECRET` | Environment variable | Bearer token for moderation endpoints (production) |
| `GhostStoragePath` | `appsettings.json` | Directory where ghost files are saved (defaults to `ghosts/`) |

### Frontend

| Setting | File | Description |
|---|---|---|
| `VITE_API_URL` | `.env.development` / `.env.production` | Base URL for all API calls |

---

## Background Services

Four background services run automatically when the API starts. They all use a shared `PollingBackgroundService` base class that guards each cycle with a semaphore so overlapping runs are skipped.

| Service | Interval | What it does |
|---|---|---|
| **LeaderboardBackgroundService** | 1 min | Fetches active WFC room groups, upserts players, tracks VR history, recalculates rankings and VR gains |
| **RoomStatusBackgroundService** | 1 min | Fetches live room data and stores a snapshot for the room browser |
| **RaceResultBackgroundService** | 1 min | Polls WFC for completed race results and persists them |
| **MiiPreFetchBackgroundService** | 30 min | Proactively fetches and caches Mii avatar images for players who don't have a fresh cache entry |

Mii images go through a two-step external pipeline: RC24 studio proxy → Nintendo Studio. The results are cached in the `PlayerMiiCaches` table (refreshed every 7 days).

---

## API Reference

Scalar API documentation is available at `/scalar` when running in development mode. The raw OpenAPI spec is served at `/openapi/v1.json`.

### Auth

All endpoints are public except `/api/moderation/*`, which requires:

```
Authorization: Bearer <WfcSecret>
```

### Rate limits (per IP)

| Policy | Limit | Applied to |
|---|---|---|
| Global | 2 000 req / min | All endpoints |
| `RefreshPolicy` | 5 req / min | `POST /api/roomstatus/refresh` |
| `DownloadPolicy` | 3 req / min | Mii image downloads |
| `GhostDownloadPolicy` | 10 req / min | Ghost file downloads |

### Key endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/leaderboard` | Paginated VR leaderboard |
| `GET` | `/api/leaderboard/player/{fc}` | Single player profile |
| `GET` | `/api/leaderboard/player/{fc}/history` | VR history over time |
| `GET` | `/api/leaderboard/player/{fc}/mii` | Mii avatar (base64) |
| `GET` | `/api/leaderboard/player/{fc}/mii/image` | Mii avatar (PNG) |
| `GET` | `/api/roomstatus` | Current live room snapshot |
| `GET` | `/api/roomstatus/history` | Paginated snapshot history |
| `GET` | `/api/timetrial` | Time trial leaderboard |
| `GET` | `/api/timetrial/tracks` | All tracks |
| `GET` | `/api/racestats/player/{pid}` | Per-player race statistics |
| `GET` | `/api/racestats/global` | Global race statistics |
| `POST` | `/api/moderation/flag` | Flag a player as suspicious |
| `POST` | `/api/moderation/unflag` | Unflag a player |
| `POST` | `/api/moderation/timetrial/submit` | Submit a ghost file |

---

## Health Checks

| Endpoint | What it checks |
|---|---|
| `/api/health` | Full report: database, PostgreSQL, Retro WFC API, memory |
| `/api/health/live` | Liveness probe (always 200 if the process is up) |
| `/api/health/ready` | Readiness probe (all checks must pass) |
