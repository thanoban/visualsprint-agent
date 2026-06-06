# Development Setup

The repository now contains the first runnable phase-1 foundation for VisualSprint.

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

## Verification

```powershell
npm run verify
```
