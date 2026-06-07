"""Adapters for deterministic ingest and media service boundaries."""

from __future__ import annotations

import json
from urllib import error, request

from visualsprint_api.config import settings
from visualsprint_api.media_pipeline import build_screen_events
from visualsprint_api.models import CaptureChunkSummary, ScreenEvent, TranscriptSegment
from visualsprint_api.transcript_pipeline import build_transcript_segments


def process_transcript_chunk(chunk: CaptureChunkSummary) -> list[TranscriptSegment]:
    """Use the ingest service when available, otherwise fall back locally."""

    if not settings.ingest_service_url:
        return build_transcript_segments(chunk)

    payload = {
        "chunkId": chunk.id,
        "clientChunkId": chunk.clientChunkId,
        "sequence": chunk.sequence,
        "recordedAt": chunk.recordedAt.isoformat(),
        "durationMs": chunk.durationMs,
        "mimeType": chunk.mimeType,
    }

    try:
        response_payload = _post_json(
            f"{settings.ingest_service_url.rstrip('/')}/api/transcript/chunks/process",
            payload,
        )
        return [
            TranscriptSegment.model_validate(segment)
            for segment in response_payload["transcriptSegments"]
        ]
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return build_transcript_segments(chunk)


def process_media_chunk(chunk: CaptureChunkSummary) -> tuple[int, list[ScreenEvent]]:
    """Use the media service when available, otherwise fall back locally."""

    if not settings.media_service_url:
        return build_screen_events(chunk)

    payload = {
        "chunkId": chunk.id,
        "clientChunkId": chunk.clientChunkId,
        "sequence": chunk.sequence,
        "recordedAt": chunk.recordedAt.isoformat(),
        "durationMs": chunk.durationMs,
        "mimeType": chunk.mimeType,
    }

    try:
        response_payload = _post_json(
            f"{settings.media_service_url.rstrip('/')}/api/media/chunks/process",
            payload,
        )
        return (
            int(response_payload["frameCount"]),
            [
                ScreenEvent.model_validate(screen_event)
                for screen_event in response_payload["screenEvents"]
            ],
        )
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return build_screen_events(chunk)


def _post_json(url: str, payload: dict) -> dict:
    response = request.urlopen(
        request.Request(
            url=url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        ),
        timeout=settings.service_request_timeout_seconds,
    )
    response_bytes = response.read()
    return json.loads(response_bytes.decode("utf-8"))
