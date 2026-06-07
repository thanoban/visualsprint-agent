"""Agent-input routes for assembled chunk insights."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from visualsprint_api.models import ChunkInsightResponse
from visualsprint_api.repository import repository

router = APIRouter(prefix="/meetings/{meeting_id}/insights", tags=["insights"])


@router.get("/chunks/{client_chunk_id}", response_model=ChunkInsightResponse)
def get_chunk_insight(meeting_id: str, client_chunk_id: str) -> ChunkInsightResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    insight = repository.get_chunk_insight(meeting_id, client_chunk_id)
    if insight is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chunk insight not found")

    return ChunkInsightResponse(insight=insight)
