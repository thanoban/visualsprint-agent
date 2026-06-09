# Cloud Run image for the VisualSprint agents adapter service.
# Build context is services/agents.
#
# This service calls the managed Vertex AI Reasoning Engine endpoints and the
# Elastic MCP endpoint over HTTP, so it only needs the lightweight FastAPI
# runtime dependencies declared in pyproject.toml.
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./pyproject.toml
COPY README.md ./README.md
COPY src ./src
COPY scripts ./scripts
COPY evals ./evals

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

ENV PORT=8080 \
    PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["sh", "-c", "uvicorn visualsprint_agents.main:app --host 0.0.0.0 --port ${PORT}"]
