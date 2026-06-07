"""Adapters for deterministic ingest and media service boundaries."""

from __future__ import annotations

import json
from urllib import error, request

from visualsprint_api.config import settings
from visualsprint_api.media_pipeline import build_screen_events
from visualsprint_api.models import (
    CaptureChunkSummary,
    CaptureChunkUploadTarget,
    ScreenEvent,
    TranscriptSegment,
)
from visualsprint_api.transcript_pipeline import build_transcript_segments


def reserve_chunk_upload_target(
    *,
    meeting_id: str,
    capture_session_id: str,
    client_chunk_id: str,
    sequence: int,
    mime_type: str,
) -> CaptureChunkUploadTarget:
    """Use the ingest service for upload reservation when available, otherwise build locally."""

    if not settings.ingest_service_url:
        return _build_local_upload_target(
            meeting_id=meeting_id,
            capture_session_id=capture_session_id,
            client_chunk_id=client_chunk_id,
            mime_type=mime_type,
        )

    payload = {
        "meetingId": meeting_id,
        "captureSessionId": capture_session_id,
        "clientChunkId": client_chunk_id,
        "sequence": sequence,
        "mimeType": mime_type,
    }

    try:
        response_payload = _post_json(
            f"{settings.ingest_service_url.rstrip('/')}/api/uploads/chunks/reserve",
            payload,
        )
        return CaptureChunkUploadTarget.model_validate(response_payload["uploadTarget"])
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return _build_local_upload_target(
            meeting_id=meeting_id,
            capture_session_id=capture_session_id,
            client_chunk_id=client_chunk_id,
            mime_type=mime_type,
        )


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


def _build_local_upload_target(
    *,
    meeting_id: str,
    capture_session_id: str,
    client_chunk_id: str,
    mime_type: str,
) -> CaptureChunkUploadTarget:
    object_path = (
        f"meetings/{meeting_id}/capture-sessions/"
        f"{capture_session_id}/chunks/{client_chunk_id}.webm"
    )
    return CaptureChunkUploadTarget(
        objectPath=object_path,
        requiredHeaders={
            "Content-Type": mime_type,
            "X-VisualSprint-Chunk-Id": client_chunk_id,
        },
    )
