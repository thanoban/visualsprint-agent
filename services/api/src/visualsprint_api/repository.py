"""In-memory repository for local VisualSprint development."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from visualsprint_api.config import settings
from visualsprint_api.models import (
    CaptureChunkSummary,
    CaptureSessionSummary,
    CreateMeetingRequest,
    RegisterCaptureChunkRequest,
    StartCaptureSessionRequest,
    LiveEvent,
    MeetingDetail,
    MeetingMetrics,
    MeetingSummary,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(slots=True)
class MeetingStore:
    """Thread-safe in-memory meeting store for early development."""

    _meetings: dict[str, MeetingDetail] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def list_meetings(self) -> list[MeetingSummary]:
        with self._lock:
            meetings = sorted(
                self._meetings.values(),
                key=lambda meeting: meeting.createdAt,
                reverse=True,
            )
            return [MeetingSummary.model_validate(meeting.model_dump()) for meeting in meetings]

    def create_meeting(self, payload: CreateMeetingRequest) -> MeetingDetail:
        created_at = _utc_now()
        meeting_id = f"mtg_{uuid4().hex[:12]}"
        detail = MeetingDetail(
            id=meeting_id,
            title=payload.title.strip(),
            participantCount=payload.participantCount,
            status="draft",
            sourceConnector=payload.sourceConnector,
            primaryTrack=settings.selected_track,
            createdAt=created_at,
            startedAt=None,
            endedAt=None,
            notes=payload.notes.strip(),
            metrics=MeetingMetrics(),
            latestEvents=[
                LiveEvent(
                    id=f"evt_{uuid4().hex[:12]}",
                    kind="system",
                    at=created_at,
                    title="Meeting session created",
                    detail=(
                        "The deterministic control plane created the meeting shell "
                        "and reserved it for the selected connector."
                    ),
                )
            ],
            activeCaptureSession=None,
            recentCaptureChunks=[],
        )

        with self._lock:
            self._meetings[meeting_id] = detail

        return detail

    def get_meeting(self, meeting_id: str) -> MeetingDetail | None:
        with self._lock:
            meeting = self._meetings.get(meeting_id)
            return None if meeting is None else meeting.model_copy(deep=True)

    def start_meeting(self, meeting_id: str) -> MeetingDetail | None:
        with self._lock:
            meeting = self._meetings.get(meeting_id)
            if meeting is None:
                return None
            if meeting.status == "draft":
                started_at = _utc_now()
                meeting.status = "live"
                meeting.startedAt = started_at
                meeting.metrics.captureEventsCount += 1
                meeting.latestEvents.insert(
                    0,
                    LiveEvent(
                        id=f"evt_{uuid4().hex[:12]}",
                        kind="capture",
                        at=started_at,
                        title="Live capture session started",
                        detail=(
                            "The meeting is now ready for browser-based capture intake "
                            "and chunk registration."
                        ),
                    ),
                )
            return meeting.model_copy(deep=True)

    def end_meeting(self, meeting_id: str) -> MeetingDetail | None:
        with self._lock:
            meeting = self._meetings.get(meeting_id)
            if meeting is None:
                return None
            if meeting.status != "ended":
                ended_at = _utc_now()
                if meeting.startedAt is None:
                    meeting.startedAt = ended_at
                if (
                    meeting.activeCaptureSession is not None
                    and meeting.activeCaptureSession.status == "recording"
                ):
                    meeting.activeCaptureSession.status = "completed"
                    meeting.activeCaptureSession.endedAt = ended_at
                meeting.status = "ended"
                meeting.endedAt = ended_at
                meeting.latestEvents.insert(
                    0,
                    LiveEvent(
                        id=f"evt_{uuid4().hex[:12]}",
                        kind="system",
                        at=ended_at,
                        title="Meeting finalized",
                        detail=(
                            "The meeting lifecycle is closed and ready for the future "
                            "summary-agent flow."
                        ),
                    ),
                )
            return meeting.model_copy(deep=True)

    def start_capture_session(
        self,
        meeting_id: str,
        payload: StartCaptureSessionRequest,
    ) -> tuple[MeetingDetail, CaptureSessionSummary] | None:
        with self._lock:
            meeting = self._meetings.get(meeting_id)
            if meeting is None:
                return None

            started_at = _utc_now()
            capture_session = CaptureSessionSummary(
                id=f"cap_{uuid4().hex[:12]}",
                status="recording",
                sourceConnector="browser_live_capture",
                recorderMimeType=payload.recorderMimeType,
                hasDisplayVideo=payload.hasDisplayVideo,
                hasDisplayAudio=payload.hasDisplayAudio,
                hasMicrophoneAudio=payload.hasMicrophoneAudio,
                startedAt=started_at,
                endedAt=None,
                chunkCount=0,
                totalBytes=0,
            )

            meeting.activeCaptureSession = capture_session
            meeting.metrics.captureEventsCount += 1
            meeting.latestEvents.insert(
                0,
                LiveEvent(
                    id=f"evt_{uuid4().hex[:12]}",
                    kind="capture",
                    at=started_at,
                    title="Browser capture session registered",
                    detail=(
                        "The control plane registered a live browser capture session "
                        "and is ready to receive chunk metadata."
                    ),
                ),
            )

            return meeting.model_copy(deep=True), capture_session.model_copy(deep=True)

    def register_capture_chunk(
        self,
        meeting_id: str,
        payload: RegisterCaptureChunkRequest,
    ) -> tuple[MeetingDetail, CaptureSessionSummary, CaptureChunkSummary] | None:
        with self._lock:
            meeting = self._meetings.get(meeting_id)
            if meeting is None or meeting.activeCaptureSession is None:
                return None

            recorded_at = _utc_now()
            chunk = CaptureChunkSummary(
                id=f"chk_{uuid4().hex[:12]}",
                sequence=payload.sequence,
                recordedAt=recorded_at,
                durationMs=payload.durationMs,
                byteSize=payload.byteSize,
                mimeType=payload.mimeType,
            )

            meeting.activeCaptureSession.chunkCount += 1
            meeting.activeCaptureSession.totalBytes += payload.byteSize
            meeting.metrics.captureChunksCount += 1
            meeting.metrics.capturedBytes += payload.byteSize
            meeting.recentCaptureChunks.insert(0, chunk)
            meeting.recentCaptureChunks = meeting.recentCaptureChunks[:8]
            meeting.latestEvents.insert(
                0,
                LiveEvent(
                    id=f"evt_{uuid4().hex[:12]}",
                    kind="capture",
                    at=recorded_at,
                    title=f"Chunk {payload.sequence} registered",
                    detail=(
                        f"Registered {payload.byteSize} bytes of capture data "
                        f"for {payload.durationMs} ms."
                    ),
                ),
            )
            meeting.latestEvents = meeting.latestEvents[:12]

            return (
                meeting.model_copy(deep=True),
                meeting.activeCaptureSession.model_copy(deep=True),
                chunk,
            )

    def complete_capture_session(
        self,
        meeting_id: str,
    ) -> tuple[MeetingDetail, CaptureSessionSummary] | None:
        with self._lock:
            meeting = self._meetings.get(meeting_id)
            if meeting is None or meeting.activeCaptureSession is None:
                return None

            completed_at = _utc_now()
            meeting.activeCaptureSession.status = "completed"
            meeting.activeCaptureSession.endedAt = completed_at
            meeting.latestEvents.insert(
                0,
                LiveEvent(
                    id=f"evt_{uuid4().hex[:12]}",
                    kind="capture",
                    at=completed_at,
                    title="Browser capture session completed",
                    detail=(
                        "The recorder stopped and the control plane closed the "
                        "capture session cleanly."
                    ),
                ),
            )

            return meeting.model_copy(deep=True), meeting.activeCaptureSession.model_copy(
                deep=True
            )


repository = MeetingStore()
