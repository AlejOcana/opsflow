# Screenshots — How to capture for README

README expects three images + one demo gif (paths are already wired in `README.md`):

```
docs/screenshots/dashboard.png   (Dashboard KPIs)
docs/screenshots/timeline.png    (Incident Timeline)
docs/screenshots/swagger.png     (Swagger in Production)
docs/demo.gif                    (10 s loop)
```

No images are committed yet — placeholders will 404 until you run this checklist and commit the files.

---

## 0) Prereq — run the stack

```bash
# from repo root F:\Development\OpenCode\opsflow
docker compose up --build
# or: docker compose up -d --build && docker compose logs -f
```

- Web: http://localhost:4200
- API: http://localhost:5000  (Swagger: http://localhost:5000/swagger  Health: http://localhost:5000/health)
- DB: postgres:16-alpine `opsflow` / `postgres` / `postgres` → `Host=db` inside compose, `Host=localhost` outside

Wait for `api` healthcheck `curl -f http://localhost:5000/health` → `{"status":"healthy"}` then open Web.

---

## 1) dashboard.png

1. Login as `admin@opsflow.io / Admin123!` (or `platformmgr@opsflow.io / Manager123!`).
2. Land on Dashboard (or navigate to `/dashboard`).
3. Wait for KPIs: `openBySeverity`, MTBF, lead time, SLA at-risk, 7-day throughput — they are tenant-scoped `?organizationId=1`.
4. Ensure window is 1440×900, light theme, no devtools.
5. Capture **full viewport** (not just the card) — include header + stats cards + KPI row.
6. Save as `docs/screenshots/dashboard.png` (PNG, ~1600×900, optimize with TinyPNG if >500 KB).

> Tip: If KPIs show zeros, ensure `DataSeeder` ran (check API logs: `EnsureCreated` + `CREATE TABLE IF NOT EXISTS "IncidentAttachments"` then seeded 10 incidents with `ResolvedAt`).

---

## 2) timeline.png

1. From Dashboard or `/incidents`, click any incident (e.g. `#1 Database connection timeout`).
2. On Incident Detail, scroll to **Timeline** tab (default). It should show chronological entries: `comment` (blue chat), `status` (orange change_circle), `audit` (purple history), `attachment` (green attach_file) — merged via `TimelineService.BuildTimeline`.
3. Also check **Comments** tab count and **Attachments** section (if attachments seeded for incidents 1–3).
4. Capture the **Timeline** tab expanded, showing at least 3 entries with actor + time + `chip-*` type pill.
5. Save as `docs/screenshots/timeline.png`.

> If timeline is empty, check `GET /api/incidents/1/timeline` returns JSON; ensure `AuditLog` + `Comment` + `IncidentAttachment` seeded.

---

## 3) swagger.png

1. Open http://localhost:5000/swagger (or https://opsflow-api.onrender.com/swagger for prod).
2. Ensure Swagger UI is visible in **Production** (enabled via `app.Environment.IsProduction()` in `Program.cs`).
3. Expand `Incidents` or `Auth` tag to show `POST /api/auth/login`, `GET /api/incidents/{id}/timeline`, `POST /api/incidents/{id}/attachments`.
4. Capture full page including top bar `OpsFlow API v1` + `Authorize` lock.
5. Save as `docs/screenshots/swagger.png`.

---

## 4) demo.gif (optional, 10 s)

Record a 10 s loop:

```
login (admin) → dashboard KPI hover → click incident → timeline scroll → Comments add → Attachments upload (Choose file → dataUri) → notification bell
```

Tools:
- Windows: ScreenToGif, ShareX, or `ffmpeg -f gdigrab -framerate 15 -i desktop -t 10 docs/demo.gif`
- macOS: Kap, Licecap, or QuickTime → GIF
- Keep ≤5 MB, 800×450, 12–15 fps.

Save as `docs/demo.gif` (README references `docs/demo.gif` at root `docs/`, not `docs/screenshots/`).

---

## 5) Commit

```bash
git add docs/screenshots/dashboard.png docs/screenshots/timeline.png docs/screenshots/swagger.png docs/demo.gif docs/screenshots/README.md
git commit -m "docs: add OpsFlow screenshots + demo gif"
```

If you cannot commit binary PNGs (size), add them to `docs/screenshots/` and push anyway — `.gitignore` does **not** ignore `docs/` (only `dist/`, `node_modules/`, `.angular/`).

---

## Checklist before PR

- [ ] `dashboard.png` shows KPIs not zeros
- [ ] `timeline.png` shows 3+ entries with type chips
- [ ] `swagger.png` shows `OpsFlow API v1` + `Authorize`
- [ ] `demo.gif` ≤5 MB, 10 s
- [ ] Paths match README: `docs/screenshots/*.png` and `docs/demo.gif` (case-sensitive)

