"""Meeting lifecycle routes for the VisualSprint API."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from visualsprint_api.models import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    MeetingStreamEvent,
    MeetingStateResponse,
    MeetingDetailResponse,
    MeetingListResponse,
)
from visualsprint_api.repository import repository

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=MeetingListResponse)
def list_meetings() -> MeetingListResponse:
    return MeetingListResponse(meetings=repository.list_meetings())


@router.post("", response_model=CreateMeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: CreateMeetingRequest) -> CreateMeetingResponse:
    return CreateMeetingResponse(meeting=repository.create_meeting(payload))


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(meeting_id: str) -> MeetingDetailResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return MeetingDetailResponse(meeting=meeting)


@router.get("/{meeting_id}/state", response_model=MeetingStateResponse)
def get_meeting_state(meeting_id: str) -> MeetingStateResponse:
    meeting_state = repository.get_meeting_state(meeting_id)
    if meeting_state is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return MeetingStateResponse(meetingState=meeting_state)


@router.get("/{meeting_id}/events")
async def stream_meeting_events(meeting_id: str) -> StreamingResponse:
    meeting = repository.get_meeting(meeting_id)
    revision = repository.get_meeting_revision(meeting_id)
    if meeting is None or revision is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    async def event_generator():
        last_revision = -1

        while True:
            current_meeting = repository.get_meeting(meeting_id)
            current_revision = repository.get_meeting_revision(meeting_id)

            if current_meeting is None or current_revision is None:
                break

            if current_revision != last_revision:
                payload = MeetingStreamEvent(
                    revision=current_revision,
                    meeting=current_meeting,
                )
                yield (
                    f"event: meeting.updated\n"
                    f"data: {json.dumps(payload.model_dump(mode='json'))}\n\n"
                )
                last_revision = current_revision

            yield ": keepalive\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/{meeting_id}/start", response_model=MeetingDetailResponse)
def start_meeting(meeting_id: str) -> MeetingDetailResponse:
    meeting = repository.start_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return MeetingDetailResponse(meeting=meeting)


@router.post("/{meeting_id}/end", response_model=MeetingDetailResponse)
def end_meeting(meeting_id: str) -> MeetingDetailResponse:
    meeting = repository.end_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return MeetingDetailResponse(meeting=meeting)
