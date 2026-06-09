# Cloud Run image for the VisualSprint control-plane API.
# Build context is services/api.
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./pyproject.toml
COPY README.md ./README.md
COPY src ./src

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

ENV PORT=8080 \
    PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1

EXPOSE 8080

# Cloud Run injects $PORT.
CMD ["sh", "-c", "uvicorn visualsprint_api.main:app --host 0.0.0.0 --port ${PORT}"]
