# OpsFlow — Incident Management System

[![Live](https://img.shields.io/badge/live-opsflow.alejocana.es-brightgreen)](https://opsflow.alejocana.es)
[![CI](https://github.com/AlejOcana/opsflow/actions/workflows/ci.yml/badge.svg)](https://github.com/AlejOcana/opsflow/actions/workflows/ci.yml)
![.NET 8](https://img.shields.io/badge/.NET-8-512BD4)
![Angular 21](https://img.shields.io/badge/Angular-21-DD0031)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)
![License MIT](https://img.shields.io/badge/license-MIT-lightgrey)

A full-stack incident management system for engineering teams — senior-grade architecture, RBAC security and clean API design. Angular frontend → .NET 8 API → PostgreSQL, live on Render + Neon + Vercel.

## Overview

OpsFlow is a SaaS internal tool for managing operational incidents through their complete lifecycle — from creation to resolution — with full audit trails, role-based access control, timeline, attachments and KPI-grade dashboards. Built to be production-shaped: `docker compose up` locally, live split-deploy in production.

## Problem Solved

Engineering teams need structured incident tracking without enterprise tool complexity or scattered chat/spreadsheet context.

OpsFlow provides:
- Workflow with valid state transitions (`Open → InProgress → Resolved → Closed`) and guarded assign/status rules
- Role-based permissions (Admin, Manager, Contributor/Viewer) with tenant-scoped dashboards
- Full audit trail + unified timeline (comments + status changes + attachments, chronological)
- Attachments MVP via URL / `data:image/*;base64` dataUri (100k validated, stored as text)
- In-app notifications on assign / status change / comment
- Clean REST API with Swagger, `/health`, pagination, filtering and consistent error handling

## Live Demo

|  | URL | Notes |
|---|---|---|
| **Web** | [https://opsflow.alejocana.es](https://opsflow.alejocana.es) (Vercel) <br> fallback: `https://opsflow-web.vercel.app` | Angular 21, `dist/opsflow-web/browser` + SPA rewrite + security headers |
| **API** | [https://opsflow-api.onrender.com/health](https://opsflow-api.onrender.com/health) | `{"status":"healthy"}` (no auth) |
| **Swagger** | [https://opsflow-api.onrender.com/swagger](https://opsflow-api.onrender.com/swagger) | Enabled in `Production` via `IsProduction()` |

> **Free tier note:** Render sleeps after ~15 min of inactivity; first request after sleep wakes in ~10–30 s. Neon free: 1 project / 3 GB / pooled connections required (`ep-xxx-pooler...`).

### Demo credentials

| Role | Email | Password | Can |
|------|-------|----------|-----|
| Admin | `admin@opsflow.io` | `Admin123!` | Full, manage org, assign, delete attachments |
| Manager | `platformmgr@opsflow.io` | `Manager123!` | Assign, status, delete attachments |
| Contributor (Operator) | `dev1@opsflow.io` | `Developer123!` | Create, change own assigned status, comment, upload |
| Viewer (User) | `dev5@opsflow.io` | _create via register_ | Read-only |

Verify live:

```bash
curl -f https://opsflow-api.onrender.com/health
# {"status":"healthy"}

curl -X POST https://opsflow-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opsflow.io","password":"Admin123!"}'
```

## Screenshots

> Placeholders — capture after `docker compose up` and login as `admin`. See capture steps in [`docs/screenshots/README.md`](docs/screenshots/README.md). Images are `docs/screenshots/*.png`.

![Dashboard](docs/screenshots/dashboard.png)
*Dashboard — stats + KPI deep dive: openBySeverity, MTBF, lead time, SLA at-risk, 7-day throughput (tenant-scoped).*

![Incident Timeline](docs/screenshots/timeline.png)
*Incident detail — unified timeline (comment / audit / status / attachment) sorted by `CreatedAt`, with hook for future attachment types.*

![Swagger](docs/screenshots/swagger.png)
*Swagger in Production — JWT Bearer, `/health`, tenant-scoped endpoints.*

**Demo GIF (10 s):**

![OpsFlow demo](docs/demo.gif)
*10-s loop: login → dashboard KPIs → incident timeline → attachment upload (dataUri) → notification.*

If images are missing locally, the paths above will 404 — run the capture checklist and commit the `docs/screenshots/*.png` + `docs/demo.gif`.

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Backend | .NET 8 Web API | Clean Architecture, Controllers + Middleware |
| ORM | Entity Framework Core 8 | `EnsureCreated` + `EnsurePhase2Tables` raw SQL for Neon |
| Database | PostgreSQL 16 + **Neon** (pooled) | Local `Host=db`, prod `ep-xxx-pooler...` `SslMode=Require` |
| Auth | JWT Bearer | `Jwt__Key` via env (`openssl rand -base64 32`), 60 min expiry, BCrypt |
| Frontend | Angular 21 (standalone + signals) + Angular Material | `environment.prod.ts` → `https://opsflow-api.onrender.com/api` |
| Infra | Docker + Docker Compose | Multi-stage SDK→publish→aspnet + `curl` healthcheck |
| Tests | xUnit + **Playwright** (124 tests: mocked + real-API + E2E) | HTML reporter, `baseURL:4200` |
| CI/CD | **GitHub Actions** (3 jobs) | `api-test` (dotnet + postgres service), `web-build` (Angular), `e2e` (Playwright + api + postgres) |
| Deploy | **Render** (api, Docker, `render.yaml`) + **Vercel** (web, `vercel.json`) + **Neon** | `healthCheckPath: /health`, rewrites, headers, pooled URL |

## Architecture

### Runtime (Render + Neon + Vercel)

```mermaid
graph TD
  User --> Vercel[Angular 21 + Nginx rewrites\n vercel.json]
  Vercel -->|https + CORS| API[.NET 8 API\n Swagger prod + /health]
  API -->|EF Core / Npgsql| Neon[(Postgres 16 Neon\n pooled ep-xxx-pooler)]
  API -->|JWT Bearer| Auth[JWT + BCrypt + RBAC]
  API --> Health[/health\]
  API --> Swagger[/swagger\]
  style API fill:#512BD4,stroke:#333,color:#fff
  style Neon fill:#336791,stroke:#333,color:#fff
  style Vercel fill:#000,stroke:#333,color:#fff
```

ASCII fallback (no Mermaid renderer):

```
Angular 21 (standalone, signals, Material)
   │ environment.prod.ts → https://opsflow-api.onrender.com/api
   ▼
Vercel — rewrites /(.*) → /index.html + security headers (X-Frame, nosniff)
   │ https + CORS__AllowedOrigins=https://opsflow.alejocana.es,https://opsflow-web.vercel.app
   ▼
.NET 8 API — Controllers → Services (Timeline/Attachment/Notification/Dashboard)
   │ JWT Bearer (Jwt__Key/Issuer/Audience) + RBAC policies (CanAssign/CanDelete/ContributorPlus)
   │ Swagger in Production + ExceptionMiddleware + /health
   ▼
EF Core 8 — Repositories + EnsureCreated + EnsurePhase2Tables (CREATE TABLE IF NOT EXISTS)
   │
   ▼
PostgreSQL 16 — local Host=db / prod Host=ep-xxx-pooler...neon.tech SslMode=Require
```

Clean Architecture (4 layers):
- **Domain**: Entities (`Incident`, `Comment`, `AuditLog`, `IncidentAttachment`, `Notification`), Enums, Interfaces
- **Application**: Services, DTOs, Validators (`CreateAttachmentRequestValidator` — `FileName` + `Url` `http(s)` or `data:image/*;base64` ≤100k, `SizeBytes` ≤50 MB)
- **Infrastructure**: EF Core, Repositories, `OpsFlowDbContext` Fluent config
- **API**: Controllers, Middleware, `Program.cs` (PORT handling, CORS switch, Swagger prod, health)

### Domain Model

```
Organization (1) ───< (N) User
Organization (1) ───< (N) Incident
Organization (1) ───< (N) Team
Incident (1) ───< (N) Comment
Incident (1) ───< (N) AuditLog
Incident (1) ───< (N) IncidentAttachment
User (1) ───< (N) Notification
```

### Workflow States

```
Open → InProgress → Resolved → Closed
            ↘ Cancelled
```

- `UpdateStatus` guards: Contributor (Operator) may only change own assigned incidents; Manager/Admin may assign; Viewer blocked.

### Role Permissions

| Action | Admin | Manager | Contributor (Operator) | Viewer (User) |
|--------|-------|---------|------------------------|----------------|
| Create incidents | ✓ | ✓ | ✓ | ✗ |
| Assign incidents | ✓ | ✓ | ✗ | ✗ |
| Change status | ✓ | ✓ | ✓* | ✗ |
| Comment / upload attachment | ✓ | ✓ | ✓ | ✗ |
| Delete attachment | ✓ | ✓ | ✗ | ✗ |
| Delete incidents | ✓ | ✓ | ✗ | ✗ |
| Manage org/users | ✓ | ✗ | ✗ | ✗ |
| View audit/timeline | ✓ | ✓ | ✓ (own) | ✓ |

*Only own assigned incidents (enforced in `IncidentsController` + `IncidentService`).

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with `email`/`username` + `password`
- `POST /api/auth/register` — Register (→ JWT)
- `GET  /api/auth/me` — Current user (Bearer)

### Incidents
- `GET  /api/incidents` — List with `organizationId`, `status`, `search`, `page`, `pageSize` (tenant-scoped)
- `POST /api/incidents` — Create (`CanCreate`: Admin/Manager/Operator)
- `GET  /api/incidents/{id}` — Get detail
- `PUT  /api/incidents/{id}` — Update (Viewer blocked; Operator only own assigned for status)
- `PATCH /api/incidents/{id}/status` — Change status `{status}` (scoped, audited, notifies reporter/assignee)
- `PATCH /api/incidents/{id}/assign` — Assign `{assigneeId}` (`CanAssign`: Manager/Admin, audited, notifies assignee)
- `GET  /api/incidents/{id}/history` — Audit history
- `GET  /api/incidents/{id}/timeline` — **Unified timeline** (`comment`/`audit`/`status`/`attachment`, sorted by `CreatedAt`) — merges Comments + AuditLogs + (hook) Attachments via `TimelineService.BuildTimeline`
- `GET  /api/incidents/{id}/comments` + `POST /api/incidents/{id}/comments` — Comments (notifies)
- `GET  /api/incidents/{id}/attachments` + `POST /api/incidents/{id}/attachments` + `DELETE /api/incidents/{id}/attachments/{attachmentId}` — Attachments MVP (local `Url`/`dataUri` validated, `ContributorPlus` can add, `Admin/Manager` can delete)

### Dashboard
- `GET /api/dashboard/stats?organizationId=1` — **Scoped KPIs**: `TotalIncidents`, `Open/InProgress/Resolved/Closed`, `Critical/High/Medium/Low`, `TotalUsers/Teams/Organizations` + **Phase2**: `openBySeverity` (group by `Priority` for Open/InProgress), `mtbfHours` (avg interval `CreatedAt`), `leadTimeAvgDays` (`ResolvedAt-CreatedAt`), `slaAtRisk` (Critical>1d, High>2d, Medium>7d, Low>14d), `throughputLast7Days` (`GetTrend(7)`)
- `GET /api/dashboard/trend?organizationId=1&days=30` — Trend

### Teams & Users & Notifications & Health
- `GET/POST /api/teams`, `GET /api/teams/{id}`, `PUT /api/teams/{id}`, `DELETE /api/teams/{id}`
- `GET /api/organizations`, `POST /api/organizations` (`Admin` only)
- `GET  /api/notifications` — own user paged, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read` (own-only), `POST /api/notifications/read-all`
- `GET /health` — no auth, Render health check

## Running Locally

### Prerequisites
- .NET 8 SDK
- Node.js 20+ · `pnpm` 9
- Docker Desktop

### Quick Start

```bash
# Start all services (db + api + web)
docker compose up --build
# Web: http://localhost:4200  API: http://localhost:5000  Swagger: http://localhost:5000/swagger  Health: http://localhost:5000/health

# Or manually:
# 1. Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16

# 2. Start API (reads appsettings.json, env overrides via __)
cd opsflow-api
dotnet restore
dotnet run --project src/OpsFlow.Api.csproj  # http://localhost:5000

# 3. Start Frontend
cd opsflow-web
pnpm install
pnpm start  # http://localhost:4200 (proxies /api to localhost:5000 if configured)
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@opsflow.io` | `Admin123!` |
| Manager | `platformmgr@opsflow.io` | `Manager123!` |
| Operator (Contributor) | `dev1@opsflow.io` | `Developer123!` |
| Viewer | _register via UI_ | — |

Seed: 1 org (`TechCorp`), 9 users, 3 teams, 10 incidents (with `ResolvedAt` for lead-time KPI), comments/audits, 2–3 attachments for incidents 1–3, 2 notifications per user (see `DataSeeder`).

## Environment Variables

Local defaults are in `appsettings.json` / `docker-compose.yml` (`Host=db`). Production reads env via `__` (e.g. `ConnectionStrings__DefaultConnection`, `Jwt__Key`, `CORS__AllowedOrigins`), per `appsettings.Production.json` (empty, env-only).

```bash
# DB
DB_HOST=localhost          # compose sets Host=db inside container
DB_PORT=5432
DB_NAME=opsflow
DB_USER=postgres
DB_PASSWORD=postgres
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=opsflow;Username=postgres;Password=postgres
# Neon prod (pooled, required):
# ConnectionStrings__DefaultConnection=Host=ep-xxx-pooler.c-2.us-east-2.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=...;SslMode=Require;ChannelBinding=Require
# or DATABASE_URL=postgresql://neondb_owner:pass@ep-xxx-pooler.../neondb?sslmode=require&channel_binding=require

# JWT (generate: openssl rand -base64 32)
Jwt__Key=OpsFlow-Super-Secret-Key-For-JWT-Token-Generation!!
Jwt__Issuer=OpsFlow.Api
Jwt__Audience=OpsFlow.Api
Jwt__ExpiryMinutes=60

# CORS (comma-separated, no spaces; Program.cs reads CORS__AllowedOrigins and CORS_ALLOWED_ORIGINS)
CORS__AllowedOrigins=http://localhost:4200
# Prod: CORS__AllowedOrigins=https://opsflow.alejocana.es,https://opsflow-web.vercel.app

# Render
ASPNETCORE_ENVIRONMENT=Production
PORT=10000                 # Render injects 10000; Program.cs reads PORT, falls back to 5000
ASPNETCORE_URLS=http://+:10000

# Vercel
API_URL=https://opsflow-api.onrender.com/api  # also VITE_API_URL / environment.prod.ts apiUrl
```

Full annotated example in [`.env.example`](.env.example) (Neon pooled URL format, `openssl rand -base64 32`, `CORS__AllowedOrigins`, Render/Vercel env).

## Security Features

- Password hashing with **BCrypt** (`BCrypt.Net-Next`)
- JWT Bearer ( `Jwt__Key` via env, `Issuer/Audience` validation, 60 min expiry)
- RBAC policies: `CanAssign` (Admin/Manager), `CanDelete`/`CanDeleteAttachment` (Admin/Manager), `CanCreate`/`ContributorPlus` (Admin/Manager/Operator), `AdminOnly` — Viewer (`User` role) blocked from create/assign/status; Contributor only own assigned status
- Organization-level scoping on **all** dashboard KPIs (`Where OrganizationId==orgId`)
- Input validation with **FluentValidation** (`CreateAttachmentRequest`: `FileName` + `Url` valid `http(s)` or `data:image/*;base64` ≤100k, `SizeBytes` ≤50 MB)
- Audit logging + unified timeline

## Testing

```bash
cd opsflow-api
dotnet test  # xUnit, 31+ tests

cd opsflow-web
pnpm install
pnpm test          # Jest — unit
pnpm e2e           # Playwright — 124 tests (mocked + real-API), html reporter, baseURL http://localhost:4200
pnpm e2e:ui        # Playwright UI
```

CI (`.github/workflows/ci.yml`, 3 jobs):
- `api-test` (dotnet restore/build/test + `XPlat Code Coverage`, `postgres:16-alpine` service not needed for mocked tests but used in e2e job)
- `web-build` (pnpm + Angular production build, artifact `web-dist`)
- `e2e` (needs `api-test` + `web-build`, services `postgres:16-alpine`, env `ConnectionStrings__DefaultConnection=Host=localhost...`, starts API on `:5000` + Web on `:4200`, `npx playwright test --reporter=html --reporter=list`)

HTML report: `opsflow-web/playwright-report` (uploaded as artifact, 14-day retention).

## Trade-offs

1. **No real-time updates**: Manual refresh / timeline reload after comment/status/attachment instead of WebSockets/SignalR — keeps infra minimal.
2. **Single org + scoped KPIs**: Dashboard previously leaked across tenants (`GetCountByStatusAsync` global); fixed to `Where OrganizationId==orgId` for all 5 KPI counts (critical/high/medium/low/status). True multi-tenant isolation would need row-level security.
3. **Basic search**: `LIKE` on title/description, no full-text (`tsvector`/`GIN`) — sufficient for 10–1000 incidents.
4. **No migrations, `EnsureCreated` + `EnsurePhase2Tables`**: MVP uses `EnsureCreated()` then raw `CREATE TABLE IF NOT EXISTS "IncidentAttachments"` / `"Notifications"` + `CREATE INDEX IF NOT EXISTS` + `ALTER COLUMN Url TYPE varchar(100000)` widen + best-effort FKs. Solves Neon existing-DB case where `EnsureCreated` does nothing if DB exists; ideal is migrations, but this keeps `EnsureCreated` per spec with no `migrations/` folder and handles Neon prod (`Host=ep-...neon.tech` pooled).
5. **Attachments 100k Url**: `HasMaxLength(2048)` too small for `dataUri`; widened to `100000` in `DbContext` + `CreateAttachmentRequestValidator` (was blocking 20 KB image ~27k base64). `SizeBytes` still ≤50 MB via `EstimateSize` (base64 `*3/4`).
6. **Assign DTO mismatch**: Frontend `incident-detail` was `PUT /incidents/{id} {assignedToUserId}` but backend expects `PATCH /assign {assigneeId}` via `AssignRequest` — fixed to `incidentService.assignIncident(id, user.id)` + `PATCH`.
7. **No real-time notifications**: In-app `Notification` on assign/status/comment + `GET /api/notifications` (own user) + `PATCH /read` / `POST /read-all`; no push/WebSocket.
8. **Pooled Neon required**: Serverless Render → Neon must use `-pooler` host with `SslMode=Require`; direct host fails under load.

## What This Demonstrates

This project showcases senior-level competencies:

### Architecture
- Clean separation of concerns (Domain/Application/Infrastructure/API)
- Repository pattern with EF Core + Npgsql
- Domain-driven design with business rules + timeline service

### Security
- JWT authentication with roles + BCrypt
- RBAC with authorization policies + organization scoping
- Input validation + audit logging (`AuditLog` + `TimelineEntry`)

### API Design
- RESTful endpoints with proper HTTP methods (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`)
- Consistent error responses + `ExceptionMiddleware`
- Pagination and filtering + `IncidentTrendDto`
- DTOs for request/response (`IncidentListDto` frontend-shaped, `TimelineEntryDto` with `metadata`)

### Full-Stack
- Angular 21 standalone + signals + Material + `environment.prod.ts` → `https://opsflow-api.onrender.com/api`
- Signal-based reactivity, service layer, interceptors
- Nginx rewrites on Vercel + security headers

### Professional Practices
- Audit logging + `EnsurePhase2Tables` for Neon
- Serilog structured logging (via `appsettings.json` `Logging`)
- Docker multi-stage (`sdk:8.0` → `publish` → `aspnet:8.0` + `curl` healthcheck)
- Seed data for demos + Neon pooled URL docs
- Playwright E2E (124) + GitHub Actions 3-job CI with postgres service + html reporter
- Live deploy plumbing: `render.yaml` (`healthCheckPath: /health`, `autoDeploy:false`) + `vercel.json` (`outputDirectory: dist/opsflow-web/browser`, rewrites) + `docs/DEPLOY.md` (Neon→Render→Vercel order)

## Deploy — Live Demo (Render + Neon + Vercel)

Split live demo: **Neon Postgres (free)** → **Render API (Docker, free, `render.yaml`)** → **Vercel Web (Angular, `vercel.json` rewrites + headers)**.

- `render.yaml` at repo root is a Render Blueprint: `opsflow-api` (Docker, `healthCheckPath: /health`, `autoDeploy: false`).
- `vercel.json` (root + `opsflow-web/vercel.json`) builds Angular to `dist/opsflow-web/browser` with SPA rewrite + security headers.
- `opsflow-web/src/environments/environment.prod.ts` defaults to `https://opsflow-api.onrender.com/api` — replace with your actual Render URL after deploy (see `docs/DEPLOY.md`).

**Order:** Neon → Render → Vercel. Full steps, pooled connection format, and verification in [docs/DEPLOY.md](docs/DEPLOY.md).

Quick verify after deploy:

```bash
curl -f https://opsflow-api.onrender.com/health          # {"status":"healthy"}
curl -f https://opsflow-api.onrender.com/swagger         # Swagger UI (prod enabled via IsProduction())
curl -X POST https://opsflow-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opsflow.io","password":"Admin123!"}' | jq .token
```

Local dev still uses `docker compose up` (`Host=db`); Render uses `Host=ep-xxx-pooler...neon.tech;SslMode=Require;ChannelBinding=Require` via `ConnectionStrings__DefaultConnection` env (see `.env.example` Neon section).

## Screenshots — How to capture

See [docs/screenshots/README.md](docs/screenshots/README.md) for exact steps. TL;DR:

```bash
docker compose up --build
# open http://localhost:4200, login admin@opsflow.io/Admin123!
# capture docs/screenshots/dashboard.png (dashboard KPIs)
# click incident → capture docs/screenshots/timeline.png
# open http://localhost:5000/swagger → capture docs/screenshots/swagger.png
# optional 10s gif: docs/demo.gif
```

## License

MIT

## Author

Alejandro Ocaña — Senior Full-Stack Engineer · Tech Lead & ERP Frontend Chapter Lead (Metro Markets Palma) · Mallorca, Spain — [GitHub](https://github.com/AlejOcana) · [LinkedIn](https://www.linkedin.com/in/alejandro-ocana-garcia) · `alejandro.ocana.garcia.1988@gmail.com`

