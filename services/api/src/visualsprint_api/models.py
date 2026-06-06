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
    latestEvents: list[LiveEvent]


class CreateMeetingRequest(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    participantCount: int = Field(ge=1, le=50)
    sourceConnector: SourceConnectorSlug
    notes: str = Field(default="", max_length=500)


class MeetingListResponse(BaseModel):
    meetings: list[MeetingSummary]


class MeetingDetailResponse(BaseModel):
    meeting: MeetingDetail


class CreateMeetingResponse(BaseModel):
    meeting: MeetingDetail
