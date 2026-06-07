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
ChunkProcessingStatus = Literal["registered", "processing", "processed"]
CaptureChunkLifecycleStatus = Literal[
    "registered",
    "upload_ready",
    "uploaded",
    "processing",
    "processed",
]
CaptureChunkUploadStatus = Literal["pending", "ready", "uploaded"]
BlockerSeverity = Literal["low", "medium", "high"]
MemoryMatchStrength = Literal["related", "recurring", "critical"]
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


class CaptureChunkUploadTarget(BaseModel):
    method: Literal["PUT"] = "PUT"
    objectPath: str = Field(min_length=8, max_length=240)
    signedUrl: str | None = None
    requiredHeaders: dict[str, str] = Field(default_factory=dict)
    expiresAt: datetime | None = None


class CaptureChunkSummary(BaseModel):
    id: str
    clientChunkId: str = Field(min_length=8, max_length=120)
    sequence: int = Field(ge=1)
    recordedAt: datetime
    durationMs: int = Field(ge=250)
    byteSize: int = Field(ge=0)
    mimeType: str = Field(min_length=3, max_length=120)
    lifecycleStatus: CaptureChunkLifecycleStatus
    uploadStatus: CaptureChunkUploadStatus
    storageObjectPath: str = Field(min_length=8, max_length=240)
    uploadTarget: CaptureChunkUploadTarget
    processingStatus: ChunkProcessingStatus
    transcriptSegmentCount: int = 0
    signalCount: int = 0


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


class TranscriptSegment(BaseModel):
    id: str
    speakerLabel: str = Field(min_length=2, max_length=60)
    startedAt: datetime
    endedAt: datetime
    text: str = Field(min_length=8, max_length=500)


class DecisionRecord(BaseModel):
    id: str
    title: str = Field(min_length=4, max_length=180)
    rationale: str = Field(min_length=8, max_length=500)
    speakerLabel: str = Field(min_length=2, max_length=60)
    recordedAt: datetime


class CommitmentRecord(BaseModel):
    id: str
    ownerLabel: str = Field(min_length=2, max_length=60)
    action: str = Field(min_length=6, max_length=220)
    dueHint: str = Field(min_length=2, max_length=60)
    recordedAt: datetime


class BlockerRecord(BaseModel):
    id: str
    summary: str = Field(min_length=6, max_length=220)
    severity: BlockerSeverity
    ownerLabel: str = Field(min_length=2, max_length=60)
    recordedAt: datetime


class MemoryMatch(BaseModel):
    id: str
    summary: str = Field(min_length=6, max_length=240)
    sourceMeetingTitle: str = Field(min_length=3, max_length=120)
    strength: MemoryMatchStrength
    recordedAt: datetime


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
    recentTranscriptSegments: list[TranscriptSegment] = Field(default_factory=list)
    recentDecisions: list[DecisionRecord] = Field(default_factory=list)
    recentCommitments: list[CommitmentRecord] = Field(default_factory=list)
    recentBlockers: list[BlockerRecord] = Field(default_factory=list)
    recentMemoryMatches: list[MemoryMatch] = Field(default_factory=list)


class CreateMeetingRequest(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    participantCount: int = Field(ge=1, le=50)
    sourceConnector: SourceConnectorSlug
    notes: str = Field(default="", max_length=500)


class StartCaptureSessionRequest(BaseModel):
    recorderMimeType: str | None = Field(default=None, min_length=3, max_length=120)
    hasDisplayVideo: bool = True
    hasDisplayAudio: bool = False
    hasMicrophoneAudio: bool = False


class RegisterCaptureChunkRequest(BaseModel):
    clientChunkId: str = Field(min_length=8, max_length=120)
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
