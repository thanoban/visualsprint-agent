"""Agent-facing output persistence routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from visualsprint_api.models import (
    RegisterAgentOutputsRequest,
    RegisterAgentOutputsResponse,
)
from visualsprint_api.repository import MeetingInvariantError, repository

router = APIRouter(prefix="/meetings/{meeting_id}/outputs", tags=["outputs"])


@router.post("/register", response_model=RegisterAgentOutputsResponse)
def register_outputs(
    meeting_id: str,
    payload: RegisterAgentOutputsRequest,
) -> RegisterAgentOutputsResponse:
    try:
        result = repository.register_outputs(meeting_id, payload)
    except MeetingInvariantError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    meeting, meeting_state = result
    return RegisterAgentOutputsResponse(meeting=meeting, meetingState=meeting_state)
