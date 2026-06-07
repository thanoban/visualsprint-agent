"""FastAPI entrypoint for the VisualSprint ingest service."""

from __future__ import annotations

from fastapi import FastAPI

from visualsprint_ingest.config import settings
from visualsprint_ingest.models import ChunkTranscriptRequest, ChunkTranscriptResponse, ServiceHealth
from visualsprint_ingest.pipeline import build_transcript_segments


app = FastAPI(
    title="VisualSprint Ingest",
    version=settings.version,
    summary="Deterministic ingest boundary for transcript production.",
)


@app.get("/api/health", response_model=ServiceHealth)
def get_health() -> ServiceHealth:
    return ServiceHealth(
        service=settings.service_name,
        version=settings.version,
        track=settings.selected_track,
    )


@app.post("/api/transcript/chunks/process", response_model=ChunkTranscriptResponse)
def process_chunk_transcript(payload: ChunkTranscriptRequest) -> ChunkTranscriptResponse:
    transcript_segments = build_transcript_segments(payload)
    return ChunkTranscriptResponse(
        chunkId=payload.chunkId,
        clientChunkId=payload.clientChunkId,
        transcriptSegments=transcript_segments,
        transcriptSegmentCount=len(transcript_segments),
    )


@app.get("/")
def get_root() -> dict[str, str]:
    return {
        "name": "VisualSprint Ingest",
        "message": "Deterministic ingest services are online.",
    }
