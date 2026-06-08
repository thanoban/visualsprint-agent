# Cloud Run image for the VisualSprint agents adapter service.
# Build context is services/agents (e.g. `gcloud run deploy --source services/agents`).
#
# This is the FastAPI *adapter* service. It calls the managed Vertex AI Reasoning
# Engine / bridge endpoints and Elastic MCP over HTTP (urllib), so it does not need
# the heavy `google-cloud-aiplatform[adk]` extra. The ADK deployable apps under
# adk_apps/ are deployed separately to Agent Engine.
FROM python:3.12-slim

WORKDIR /app

# Pinned to match services/agents/pyproject.toml.
RUN pip install --no-cache-dir "fastapi==0.136.3" "uvicorn[standard]==0.49.0"

COPY src ./src

ENV PORT=8080 \
    PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["sh", "-c", "uvicorn visualsprint_agents.main:app --host 0.0.0.0 --port ${PORT}"]
