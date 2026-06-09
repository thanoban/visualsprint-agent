# VisualSprint Web Frontend Architecture

Scalable feature-based structure for the Next.js app.

## Layers

```
apps/web/src/
  app/                 # Routes only — thin pages delegating to features
  components/
    ui/                # Design system primitives (Button, Card, Badge…)
    domain/            # Reusable domain presentational components
    layout/            # App shell, theme, meeting top bar
    providers/         # Global React providers
    shared/            # Cross-cutting UI (error banners)
  features/
    landing/           # Marketing landing page
    meetings/          # Meeting list
    meeting-session/   # Shared session state (provider, capture hook)
    setup/             # Meeting creation + capture onboarding
    live/              # Live session dashboard
    report/            # Hero final report
    actions/           # Approval portal
    dev/               # Env-gated integration tools
    workspace/         # View router wrapping session provider
  hooks/               # Shared data hooks (React Query, SSE)
  lib/                 # API client, formatters, capture utils
```

## Data flow

1. **Routes** render a `ThemeWrapper` + `MeetingWorkspace` (or standalone feature page).
2. **`MeetingSessionProvider`** owns meeting state, SSE sync, capture, and mutations.
3. **Feature pages** consume `useMeetingSession()` and compose domain components.
4. **`lib/api.ts`** is the only REST surface; types come from `@visualsprint/contracts`.

## Adding a new feature

1. Create `features/<name>/` with `*-page.tsx` and `components/`.
2. Add a route under `app/` that wraps the page in the correct theme.
3. If the feature needs meeting state, nest inside `MeetingSessionProvider` via `MeetingWorkspace` or directly.

## Theming

- **ink** — live session, landing, dev tools
- **paper** — setup, meeting list, report, actions

Tokens live in `app/globals.css` (`--brand`, `--surface`, etc.).

## Evidence linking

- `lib/evidence-linking.ts` — time-window and reference-based joins between transcript and visual events.
- `features/live/components/linked-evidence-feed.tsx` — interactive transcript ↔ visual panel.
- Clicking evidence on decision/commitment/blocker cards highlights linked transcript and frame rows.

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Control plane REST + SSE base URL (default `http://127.0.0.1:8000`) |
| `NEXT_PUBLIC_SHOW_DEV_PANELS` | Set `true` to expose `/dev` integration tools |

Ensure `VISUALSPRINT_ALLOWED_ORIGINS` on the API includes your web origin (e.g. `http://localhost:3000`).

## Run locally

```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — web (from repo root; loads NEXT_PUBLIC_* from .env when using npm scripts)
npm run dev:web
```

Open `http://localhost:3000`. Flow: **Landing → New meeting → Start → Live capture → End → Report → Actions**.

## Production build

```bash
npm run build:web
npm run start:web
```

Docker (from repo root):

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-api.run.app \
  -t visualsprint-web .
```

## Wiring map

| Surface | State | API |
|---------|-------|-----|
| Meeting list | `useMeetings` (React Query) | `GET /api/meetings` |
| Setup / session | `MeetingSessionProvider` | create, start, capture, end |
| Live session | Provider + `useMeetingStream` (SSE) | `GET /api/meetings/:id/events` |
| Report | Provider `finalReport` | `GET/POST /api/meetings/:id/final-report` |
| Actions | Provider `actionRecommendations` | recommendations approve/reject/execute |
| Dev tools | Provider (env-gated) | meta, smoke, chunk insight, summary packet |
