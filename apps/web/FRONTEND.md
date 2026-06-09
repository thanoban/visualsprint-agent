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
