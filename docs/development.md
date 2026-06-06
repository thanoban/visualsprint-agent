# Development Setup

The repository now contains a runnable phase-2 foundation for VisualSprint, including:

- the Next.js dashboard shell
- the FastAPI control plane
- local meeting session lifecycle endpoints
- browser capture readiness checks in the UI

## Web app

```powershell
npm install
npm run dev:web
```

The web shell starts at `http://localhost:3000`.

## API service

```powershell
python -m uvicorn visualsprint_api.main:app --app-dir services/api/src --reload --host 127.0.0.1 --port 8000
```

The API exposes:

- `GET /`
- `GET /api/health`
- `GET /api/meta`
- `GET /api/meetings`
- `POST /api/meetings`
- `GET /api/meetings/{meeting_id}`
- `POST /api/meetings/{meeting_id}/start`
- `POST /api/meetings/{meeting_id}/end`

The web app expects the API at `http://127.0.0.1:8000` by default. Override with:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
```

## Verification

```powershell
npm run verify
```
