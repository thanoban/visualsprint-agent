"""Pydantic models for the VisualSprint API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


MeetingStatus = Literal["draft", "live", "ended"]
SourceConnectorSlug = Literal[
    "browser_live_capture",
    "recording_upload",
    "document_link",
]
CaptureSessionStatus = Literal["idle", "recording", "completed"]
LiveEventKind = Literal[
    "system",
    "capture",
    "transcript",
    "decision",
    "commitment",
    "blocker",
    "memory",
]


class MeetingMetrics(BaseModel):
    decisionsCount: int = 0
    commitmentsCount: int = 0
    blockersCount: int = 0
    memoryMatchesCount: int = 0
    transcriptSegmentsCount: int = 0
    captureEventsCount: int = 0
    captureChunksCount: int = 0
    capturedBytes: int = 0


class CaptureChunkSummary(BaseModel):
    id: str
    sequence: int = Field(ge=1)
    recordedAt: datetime
    durationMs: int = Field(ge=250)
    byteSize: int = Field(ge=0)
    mimeType: str = Field(min_length=3, max_length=120)


class CaptureSessionSummary(BaseModel):
    id: str
    status: CaptureSessionStatus
    sourceConnector: SourceConnectorSlug
    recorderMimeType: str = Field(min_length=3, max_length=120)
    hasDisplayVideo: bool
    hasDisplayAudio: bool
    hasMicrophoneAudio: bool
    startedAt: datetime
    endedAt: datetime | None = None
    chunkCount: int = 0
    totalBytes: int = 0


class LiveEvent(BaseModel):
    id: str
    kind: LiveEventKind
    at: datetime
    title: str
    detail: str


class MeetingSummary(BaseModel):
    id: str
    title: str = Field(min_length=3, max_length=120)
    participantCount: int = Field(ge=1, le=50)
    status: MeetingStatus
    sourceConnector: SourceConnectorSlug
    primaryTrack: str
    createdAt: datetime
    startedAt: datetime | None = None
    endedAt: datetime | None = None
    notes: str = Field(default="", max_length=500)
    metrics: MeetingMetrics


class MeetingDetail(MeetingSummary):
    latestEvents: list[LiveEvent] = Field(default_factory=list)
    activeCaptureSession: CaptureSessionSummary | None = None
    recentCaptureChunks: list[CaptureChunkSummary] = Field(default_factory=list)


class CreateMeetingRequest(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    participantCount: int = Field(ge=1, le=50)
    sourceConnector: SourceConnectorSlug
    notes: str = Field(default="", max_length=500)


class StartCaptureSessionRequest(BaseModel):
    recorderMimeType: str = Field(min_length=3, max_length=120)
    hasDisplayVideo: bool = True
    hasDisplayAudio: bool = False
    hasMicrophoneAudio: bool = False


class RegisterCaptureChunkRequest(BaseModel):
    sequence: int = Field(ge=1)
    durationMs: int = Field(ge=250, le=120_000)
    byteSize: int = Field(ge=0)
    mimeType: str = Field(min_length=3, max_length=120)


class MeetingListResponse(BaseModel):
    meetings: list[MeetingSummary]


class MeetingDetailResponse(BaseModel):
    meeting: MeetingDetail


class CreateMeetingResponse(BaseModel):
    meeting: MeetingDetail


class CaptureSessionResponse(BaseModel):
    meeting: MeetingDetail
    captureSession: CaptureSessionSummary


class RegisterCaptureChunkResponse(CaptureSessionResponse):
    chunk: CaptureChunkSummary
