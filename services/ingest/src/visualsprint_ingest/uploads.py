"""Deterministic upload reservation helpers for the ingest service."""

from __future__ import annotations

from visualsprint_ingest.models import ChunkUploadReservationRequest, ChunkUploadTarget


def reserve_chunk_upload_target(payload: ChunkUploadReservationRequest) -> ChunkUploadTarget:
    """Build a deterministic upload contract for a capture chunk."""

    object_path = (
        f"meetings/{payload.meetingId}/capture-sessions/"
        f"{payload.captureSessionId}/chunks/{payload.clientChunkId}.webm"
    )
    return ChunkUploadTarget(
        objectPath=object_path,
        requiredHeaders={
            "Content-Type": payload.mimeType,
            "X-VisualSprint-Chunk-Id": payload.clientChunkId,
        },
    )
