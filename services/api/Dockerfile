FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

COPY services/api/pyproject.toml /app/pyproject.toml
COPY services/api/README.md /app/README.md
COPY services/api/src /app/src

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

EXPOSE 8080

CMD ["sh", "-c", "uvicorn visualsprint_api.main:app --host 0.0.0.0 --port ${PORT:-8080} --app-dir /app/src"]
