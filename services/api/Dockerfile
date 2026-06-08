# Cloud Run image for the VisualSprint control-plane API.
# Build context is services/api (e.g. `gcloud run deploy --source services/api`).
FROM python:3.12-slim

WORKDIR /app

# Pinned to match services/api/pyproject.toml.
RUN pip install --no-cache-dir "fastapi==0.136.3" "uvicorn[standard]==0.49.0"

COPY src ./src

ENV PORT=8080 \
    PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1

EXPOSE 8080

# Cloud Run injects $PORT.
CMD ["sh", "-c", "uvicorn visualsprint_api.main:app --host 0.0.0.0 --port ${PORT}"]
