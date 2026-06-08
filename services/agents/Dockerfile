FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

COPY services/agents/pyproject.toml /app/pyproject.toml
COPY services/agents/README.md /app/README.md
COPY services/agents/src /app/src
COPY services/agents/scripts /app/scripts
COPY services/agents/evals /app/evals

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

EXPOSE 8080

CMD ["sh", "-c", "uvicorn visualsprint_agents.main:app --host 0.0.0.0 --port ${PORT:-8080} --app-dir /app/src"]
