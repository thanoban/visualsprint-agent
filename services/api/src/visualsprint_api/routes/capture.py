"""Capture session routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from visualsprint_api.models import (
    ChunkContextResponse,
    CompleteCaptureChunkUploadRequest,
    CompleteCaptureChunkUploadResponse,
    CaptureSessionResponse,
    RegisterCaptureChunkRequest,
    RegisterCaptureChunkResponse,
    StartCaptureSessionRequest,
)
from visualsprint_api.repository import MeetingInvariantError, repository

router = APIRouter(
    prefix="/meetings/{meeting_id}/capture-sessions",
    tags=["capture"],
)


@router.post("/start", response_model=CaptureSessionResponse, status_code=status.HTTP_201_CREATED)
def start_capture_session(
    meeting_id: str,
    payload: StartCaptureSessionRequest,
) -> CaptureSessionResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    if meeting.status != "live":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Meeting must be live before capture can start",
        )
    if meeting.sourceConnector != "browser_live_capture":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Capture start is only supported for browser_live_capture meetings",
        )
    if (
        meeting.activeCaptureSession is not None
        and meeting.activeCaptureSession.status == "recording"
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A browser capture session is already recording for this meeting",
        )

    result = repository.start_capture_session(meeting_id, payload)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    meeting, capture_session = result
    return CaptureSessionResponse(meeting=meeting, captureSession=capture_session)


@router.post("/chunk", response_model=RegisterCaptureChunkResponse)
def register_capture_chunk(
    meeting_id: str,
    payload: RegisterCaptureChunkRequest,
) -> RegisterCaptureChunkResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )
    if meeting.activeCaptureSession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )
    if meeting.activeCaptureSession.status != "recording":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Capture chunks can only be registered while the session is recording",
        )

    try:
        result = repository.register_capture_chunk(meeting_id, payload)
    except MeetingInvariantError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )
    meeting, capture_session, chunk = result
    return RegisterCaptureChunkResponse(
        meeting=meeting,
        captureSession=capture_session,
        chunk=chunk,
    )


@router.get("/chunks/{client_chunk_id}/context", response_model=ChunkContextResponse)
def get_chunk_context(meeting_id: str, client_chunk_id: str) -> ChunkContextResponse:
    meeting_state = repository.get_meeting_state(meeting_id)
    if meeting_state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )

    chunk_context = repository.get_chunk_context(meeting_id, client_chunk_id)
    if chunk_context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chunk context not found",
        )

    return ChunkContextResponse(
        meetingId=meeting_id,
        meetingState=meeting_state,
        chunkContext=chunk_context,
    )


@router.post("/chunk/upload-complete", response_model=CompleteCaptureChunkUploadResponse)
def complete_capture_chunk_upload(
    meeting_id: str,
    payload: CompleteCaptureChunkUploadRequest,
) -> CompleteCaptureChunkUploadResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None or meeting.activeCaptureSession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )

    try:
        result = repository.complete_capture_chunk_upload(meeting_id, payload)
    except MeetingInvariantError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )
    meeting, capture_session, chunk = result
    return CompleteCaptureChunkUploadResponse(
        meeting=meeting,
        captureSession=capture_session,
        chunk=chunk,
    )


@router.post("/complete", response_model=CaptureSessionResponse)
def complete_capture_session(meeting_id: str) -> CaptureSessionResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None or meeting.activeCaptureSession is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )

    result = repository.complete_capture_session(meeting_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting or capture session not found",
        )
    meeting, capture_session = result
    return CaptureSessionResponse(meeting=meeting, captureSession=capture_session)
