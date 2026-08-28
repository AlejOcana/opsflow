# OpsFlow — Deploy Guide (Render API + Neon Postgres + Vercel Web)

Live split-demo plumbing: **Neon** (Postgres) → **Render** (opsflow-api, Docker) → **Vercel** (opsflow-web, Angular).

> No secrets are committed. All production values are set via Render/Vercel dashboard env vars.

---

## 0) Architecture

```
Vercel (opsflow-web)  ──https──>  Render (opsflow-api, Docker, /health)  ──ssl──>  Neon (Postgres, pooled)
   dist/opsflow-web/browser           opsflow-api/Dockerfile                         ep-xxx-pooler.neon.tech
   environment.prod.ts                ASPNETCORE_ENVIRONMENT=Production              sslmode=require
```

- Local dev still uses `docker compose up` with `Host=db` (postgres:16-alpine).
- Production uses `Host=ep-xxx-pooler...neon.tech` with `SslMode=Require` (see .env.example).

---

## 1) Neon — Create project & get pooled connection string

**Free tier (as of 2024-2025):** 1 project, 10 branches, 500 branches? Actually free: 1 project, 10 branches, 3 GB storage, 100 CU-hours, autoscale 0.25–2 CU, 1-day point-in-time restore. Pooled connection required for serverless.

1. Go to https://console.neon.tech → **New Project**
   - Name: `opsflow` (or `opsflow-prod`)
   - Region: pick closest to Render region (e.g. `AWS US East 2 (Ohio)` if Render is `Ohio`).
   - Postgres version: 16 (default).

2. After create, open **Dashboard → Connect** → select:
   - **Branch:** `main`
   - **Database:** `neondb` (default)
   - **Role:** `neondb_owner`
   - Toggle **Pooled connection** = **ON** (PgBouncer, `ep-xxx-pooler...`).
   - Copy the `DATABASE_URL` style: `postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

3. For .NET Npgsql, convert to `Host=` format (or use `DATABASE_URL` with Npgsql 8 which accepts both). Recommended for Render:

   ```
   Host=ep-xxx-pooler.c-2.us-east-2.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=YOUR_PASSWORD;SslMode=Require;ChannelBinding=Require
   ```

   **Important:** use the `-pooler` host, not the direct `ep-xxx.c-...`. Keep `SslMode=Require`.

4. (Optional) Save the **direct** (non-pooled) host for local tools/psql: `ep-xxx.c-2...` without `-pooler`.

5. No need to create tables manually — `OpsFlowDbContext.Database.EnsureCreated()` + `EnsurePhase2TablesAsync()` (raw `CREATE TABLE IF NOT EXISTS`) will create all tables + indexes on first API start. See `opsflow-api/src/Program.cs`.

---

## 2) Render — Deploy opsflow-api (Docker)

**Prereq:** repo pushed to GitHub (Render connects via Blueprint `render.yaml`).

1. Go to https://dashboard.render.com → **New + → Blueprint** → connect `alejocana/opsflow` (or your fork).
2. Render reads `render.yaml` at repo root:
   - Service: `opsflow-api` (type `web`, env `docker`, plan `free`)
   - `dockerfilePath: ./opsflow-api/Dockerfile`, `dockerContext: ./opsflow-api`
   - `healthCheckPath: /health`
   - `autoDeploy: false` (manual deploys).

3. In **Environment** for `opsflow-api`, set these (sync:false values — fill in dashboard):

   | Key | Value / How to get |
   |-----|-------------------|
   | `ConnectionStrings__DefaultConnection` | Host=ep-xxx-pooler... from step 1 (pooled). Test with `psql "postgresql://..." -c "select 1"` first. |
   | `Jwt__Key` | `openssl rand -base64 32` (44 chars) or `openssl rand -base64 48`. Keep same across deploys; if you rotate, users must re-login. |
   | `Jwt__Issuer` | `OpsFlow.Api` |
   | `Jwt__Audience` | `OpsFlow.Api` |
   | `CORS__AllowedOrigins` | `https://opsflow.alejocana.es,https://opsflow-web.vercel.app` (add your Vercel URL exactly, comma-separated, no spaces) |
   | `ASPNETCORE_ENVIRONMENT` | `Production` (already in render.yaml) |
   | `ASPNETCORE_URLS` | `http://+:10000` (Render injects `PORT=10000`; Program.cs reads `PORT` automatically) |

   Leave `Jwt__Key` **sync:false** — do not use the example from `.env.example` or `docker-compose.yml`.

4. **Deploy** → **Manual Deploy → Deploy latest commit**.

5. Watch logs. On first start you should see EF `EnsureCreated` + `CREATE TABLE IF NOT EXISTS` then `DataSeeder` seeding 1 org / 9 users / 3 teams / 10 incidents.

6. Verify:

   ```bash
   curl -f https://opsflow-api.onrender.com/health
   # {"status":"healthy"}

   curl -f https://opsflow-api.onrender.com/swagger
   # or open https://opsflow-api.onrender.com/swagger in browser

   curl -f https://opsflow-api.onrender.com/api/dashboard/stats?organizationId=1 -H "Authorization: Bearer <token>"
   ```

   Free tier sleeps after 15 min; first request after sleep is ~30s cold start — expected.

7. If you forked, your API URL will be `https://opsflow-api-xxxx.onrender.com` — copy it for Vercel step.

> **Local vs Render:** `docker-compose.yml` keeps `Host=db` for local. Render overrides via env var `Host=ep-...neon.tech` — no code change. Verify production `appsettings.Production.json` has empty secrets (it does — values come from env).

---

## 3) Vercel — Deploy opsflow-web (Angular)

**Build output:** `dist/opsflow-web/browser` (see `opsflow-web/angular.json` `outputPath: dist/opsflow-web` + `browser` subfolder for Angular 17+ `application` builder).

1. Go to https://vercel.com/new → **Import** `alejocana/opsflow` → configure:

   - **Framework Preset:** Angular
   - **Root Directory:** `opsflow-web` (if using `opsflow-web/vercel.json`) **or** leave root and use root `vercel.json` which does `cd opsflow-web && npm run build`.
   - **Build Command:** (auto-injected, see `vercel.json`) `API_URL=${API_URL:-https://opsflow-api.onrender.com/api} && echo "export const environment={production:true,apiUrl:'$API_URL'}" > src/environments/environment.prod.ts && npm run build` — when Root Directory is `opsflow-web`; root `vercel.json` uses `> opsflow-web/src/environments/environment.prod.ts && cd opsflow-web && npm run build`.
   - **Output Directory:** `dist/opsflow-web/browser`
   - **Install Command:** `npm install` (or `npm ci`).

2. **Environment Variables** (Vercel → Project → Settings → Environment Variables):

   | Key | Value |
   |-----|-------|
   | `API_URL` | `https://opsflow-api.onrender.com/api` (replace with your actual Render API URL from step 2.7) |

   Angular does **not** read `process.env` at runtime; `environment.prod.ts` is baked at build time via `fileReplacements` (`angular.json`). `vercel.json` `env.API_URL` alone is **not** read at runtime — it is a build-time placeholder. The `buildCommand` in both `vercel.json` files now auto-injects the live value: `API_URL=${API_URL:-https://opsflow-api.onrender.com/api} && echo "export const environment={production:true,apiUrl:'$API_URL'}" > src/environments/environment.prod.ts` before `npm run build`. Just set `API_URL` in Vercel dashboard and redeploy; no manual file edit needed. Manual edit of `opsflow-web/src/environments/environment.prod.ts` still works as fallback if you deploy without Vercel env.

3. **Deploy** → Vercel builds and outputs to `dist/opsflow-web/browser` with SPA rewrite (`/(.*)` → `/index.html`) and security headers (see `vercel.json`).

4. Verify:

   - Open `https://opsflow-web.vercel.app` (or your `https://opsflow.alejocana.es` if custom domain).
   - Login with `admin@opsflow.io / Admin123!` — should hit `https://opsflow-api.onrender.com/api/auth/login`.
   - If CORS error, check Render `CORS__AllowedOrigins` includes exact Vercel URL and that `environment.prod.ts` `apiUrl` matches Render URL.

---

## 4) Deploy order summary

```
1. Neon (create project, copy pooled Host=...)
2. Render (set ConnectionStrings__DefaultConnection + Jwt__Key + CORS__AllowedOrigins, deploy, check /health)
3. Vercel (set API_URL or edit environment.prod.ts, deploy, check login)
```

Do not reverse — API needs Neon URL to start; Web needs API URL to build.

---

## 5) Health check verification checklist

- [ ] `GET https://opsflow-api.onrender.com/health` → `{"status":"healthy"}` (no auth)
- [ ] `GET https://opsflow-api.onrender.com/swagger` → Swagger UI (prod enabled via `IsProduction()` check)
- [ ] `POST https://opsflow-api.onrender.com/api/auth/login` with demo creds → `token` returned
- [ ] `GET https://opsflow-api.onrender.com/api/dashboard/stats?organizationId=1` with Bearer token → stats JSON
- [ ] Vercel web loads and login succeeds (check browser Network tab for `apiUrl` correctness)

If health check fails on Render:
- Check Render logs for Npgsql `Host=` parsing or `SslMode=require` missing.
- Check `Jwt:Key missing` — means `Jwt__Key` not set.
- Check `PORT` handling — Program.cs reads `PORT` env and falls back to 5000 locally.

---

## 6) Local vs Production matrix

| Concern | Local (`docker compose`) | Production (Render + Neon) |
|---------|--------------------------|----------------------------|
| DB Host | `db` (service name) | `ep-xxx-pooler...neon.tech` |
| DB User/Pass | `postgres/postgres` | `neondb_owner/<secret>` |
| SslMode | none | `Require` + `ChannelBinding=Require` |
| API URL | `http://localhost:5000` | `https://opsflow-api.onrender.com` |
| Web URL | `http://localhost:4200` | `https://opsflow-web.vercel.app` |
| CORS origins | `http://localhost:4200` or `AllowAll` | `https://opsflow.alejocana.es,https://opsflow-web.vercel.app` |
| Jwt Key | `OpsFlowSecretKey...` in compose | `openssl rand -base64 32` in Render dashboard |

`appsettings.Production.json` intentionally has empty `Jwt:Key` and `ConnectionStrings:DefaultConnection` — values must come from env. `appsettings.json` has local defaults only.

---

## 7) Rollback / Reset

- **Neon reset:** Neon dashboard → Branches → `main` → **Reset** or create new branch `staging` with new pooled URL, update Render env, redeploy.
- **Render reset:** Manual Deploy → **Clear cache & deploy**.
- **Vercel reset:** Deployments → **Redeploy** previous.

Destructive local reset (if schema drifts):

```bash
docker compose down -v   # removes pgdata volume
docker compose up --build
```

Never run `down -v` against Neon — it’s external.

---

## 8) References

- Render Blueprint spec: https://render.com/docs/blueprint-spec
- Render Docker + health checks: https://render.com/docs/docker, https://render.com/docs/health-checks
- Neon pooled connections: https://neon.tech/docs/connect/connection-pooling, https://neon.tech/docs/get-started-with-neon/connection-string
- Vercel Angular: https://vercel.com/guides/deploying-angular-with-vercel, https://vercel.com/docs/projects/project-configuration#verceljson
- Angular fileReplacements: `angular.json` `fileReplacements` `environment.ts` → `environment.prod.ts`

