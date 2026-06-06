"""In-memory repository for local VisualSprint development."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from threading import Lock
from uuid import uuid4

from visualsprint_api.config import settings
from visualsprint_api.models import (
    BlockerRecord,
    CaptureChunkSummary,
    CaptureSessionSummary,
    CommitmentRecord,
    CreateMeetingRequest,
    DecisionRecord,
    RegisterCaptureChunkRequest,
    StartCaptureSessionRequest,
    LiveEvent,
    MemoryMatch,
    MeetingDetail,
    MeetingMetrics,
    MeetingSummary,
    TranscriptSegment,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


SPEAKER_ROTATION = ("Avery", "Jordan", "Mina", "Theo", "Samir", "Priya")
TRANSCRIPT_TEMPLATES = (
    (
        "We have a release risk around the authentication flow because the environment config is still drifting.",
        "Let's lock the release path today and record the owner so the blocker does not roll into another sprint.",
    ),
    (
        "The shared screen confirms the deployment pipeline failed on the same migration validation step again.",
        "If we isolate the data fix and rerun staging today, we can unblock the release candidate before tomorrow.",
    ),
    (
        "Support escalations increased after the last rollout, so we need a visible decision on alert ownership.",
        "I want the meeting summary to call out the exact commitment and whether this was promised in earlier meetings.",
    ),
)

DECISION_TEMPLATES = (
    (
        "Stabilize the release path before feature work resumes",
        "The team agreed to freeze net-new work until the auth and pipeline evidence looks stable.",
    ),
    (
        "Separate the migration fix from the wider deployment batch",
        "Keeping the rollback surface smaller reduces release risk and shortens validation time.",
    ),
    (
        "Promote alert ownership into the sprint handoff checklist",
        "The group wants recurring operational work to survive meeting boundaries instead of staying verbal only.",
    ),
)

COMMITMENT_TEMPLATES = (
    ("Jordan", "Publish the release checklist update in the engineering channel", "Today"),
    ("Mina", "Run the staging migration fix and attach screenshots to the ticket", "Before standup"),
    ("Theo", "Update the alert ownership document with the new on-call handoff", "This sprint"),
)

BLOCKER_TEMPLATES = (
    ("Auth configuration drift is still blocking the release candidate.", "high", "Avery"),
    ("Migration validation is failing on repeated staging runs.", "medium", "Mina"),
    ("Alert routing ownership is unclear across platform and support.", "medium", "Theo"),
)

MEMORY_TEMPLATES = (
    (
        "A similar auth blocker was raised two weeks ago and was marked unresolved.",
        "Sprint 21 release review",
        "recurring",
    ),
    (
        "The same migration issue appeared in a prior staging rehearsal and required a scoped rerun.",
        "Infra readiness sync",
        "related",
    ),
    (
        "Alert ownership drift was previously discussed during the last incident follow-up.",
        "Post-incident action review",
        "critical",
    ),
)


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
            recentTranscriptSegments=[],
            recentDecisions=[],
            recentCommitments=[],
            recentBlockers=[],
            recentMemoryMatches=[],
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
                processingStatus="registered",
                transcriptSegmentCount=0,
                signalCount=0,
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
            self._apply_mock_processing(meeting, chunk)
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

    def _apply_mock_processing(
        self,
        meeting: MeetingDetail,
        chunk: CaptureChunkSummary,
    ) -> None:
        recorded_at = chunk.recordedAt
        template_index = (chunk.sequence - 1) % len(TRANSCRIPT_TEMPLATES)
        first_line, second_line = TRANSCRIPT_TEMPLATES[template_index]
        speaker_one = SPEAKER_ROTATION[(chunk.sequence - 1) % len(SPEAKER_ROTATION)]
        speaker_two = SPEAKER_ROTATION[chunk.sequence % len(SPEAKER_ROTATION)]
        first_end = recorded_at + timedelta(milliseconds=max(chunk.durationMs // 2, 250))
        final_end = recorded_at + timedelta(milliseconds=max(chunk.durationMs, 500))

        transcript_segments = [
            TranscriptSegment(
                id=f"trn_{uuid4().hex[:12]}",
                speakerLabel=speaker_one,
                startedAt=recorded_at,
                endedAt=first_end,
                text=first_line,
            ),
            TranscriptSegment(
                id=f"trn_{uuid4().hex[:12]}",
                speakerLabel=speaker_two,
                startedAt=first_end,
                endedAt=final_end,
                text=second_line,
            ),
        ]

        meeting.recentTranscriptSegments = (
            list(reversed(transcript_segments)) + meeting.recentTranscriptSegments
        )[:10]
        meeting.metrics.transcriptSegmentsCount += len(transcript_segments)
        chunk.processingStatus = "processing"
        chunk.transcriptSegmentCount = len(transcript_segments)
        meeting.latestEvents.insert(
            0,
            LiveEvent(
                id=f"evt_{uuid4().hex[:12]}",
                kind="transcript",
                at=final_end,
                title=f"Transcript extracted for chunk {chunk.sequence}",
                detail=(
                    f"{speaker_one} and {speaker_two} segments were produced from the "
                    "capture window."
                ),
            ),
        )

        decision_title, decision_rationale = DECISION_TEMPLATES[template_index]
        decision = DecisionRecord(
            id=f"dec_{uuid4().hex[:12]}",
            title=decision_title,
            rationale=decision_rationale,
            speakerLabel=speaker_two,
            recordedAt=final_end,
        )
        meeting.recentDecisions.insert(0, decision)
        meeting.recentDecisions = meeting.recentDecisions[:6]
        meeting.metrics.decisionsCount += 1
        meeting.latestEvents.insert(
            0,
            LiveEvent(
                id=f"evt_{uuid4().hex[:12]}",
                kind="decision",
                at=final_end,
                title="Reasoning agent drafted a decision",
                detail=decision.title,
            ),
        )

        signal_count = 1

        if chunk.sequence % 2 == 1:
            owner_label, action, due_hint = COMMITMENT_TEMPLATES[template_index]
            commitment = CommitmentRecord(
                id=f"cmt_{uuid4().hex[:12]}",
                ownerLabel=owner_label,
                action=action,
                dueHint=due_hint,
                recordedAt=final_end,
            )
            meeting.recentCommitments.insert(0, commitment)
            meeting.recentCommitments = meeting.recentCommitments[:6]
            meeting.metrics.commitmentsCount += 1
            meeting.latestEvents.insert(
                0,
                LiveEvent(
                    id=f"evt_{uuid4().hex[:12]}",
                    kind="commitment",
                    at=final_end,
                    title="Commitment recorded",
                    detail=f"{commitment.ownerLabel}: {commitment.action}",
                ),
            )
            signal_count += 1

        if chunk.sequence % 3 != 0:
            blocker_summary, blocker_severity, blocker_owner = BLOCKER_TEMPLATES[template_index]
            blocker = BlockerRecord(
                id=f"blk_{uuid4().hex[:12]}",
                summary=blocker_summary,
                severity=blocker_severity,
                ownerLabel=blocker_owner,
                recordedAt=final_end,
            )
            meeting.recentBlockers.insert(0, blocker)
            meeting.recentBlockers = meeting.recentBlockers[:6]
            meeting.metrics.blockersCount += 1
            meeting.latestEvents.insert(
                0,
                LiveEvent(
                    id=f"evt_{uuid4().hex[:12]}",
                    kind="blocker",
                    at=final_end,
                    title="Blocker flagged",
                    detail=f"{blocker.summary} Owner: {blocker.ownerLabel}.",
                ),
            )
            signal_count += 1

        memory_summary, source_meeting_title, strength = MEMORY_TEMPLATES[template_index]
        memory_match = MemoryMatch(
            id=f"mem_{uuid4().hex[:12]}",
            summary=memory_summary,
            sourceMeetingTitle=source_meeting_title,
            strength=strength,
            recordedAt=final_end,
        )
        meeting.recentMemoryMatches.insert(0, memory_match)
        meeting.recentMemoryMatches = meeting.recentMemoryMatches[:6]
        meeting.metrics.memoryMatchesCount += 1
        meeting.latestEvents.insert(
            0,
            LiveEvent(
                id=f"evt_{uuid4().hex[:12]}",
                kind="memory",
                at=final_end,
                title="Elastic memory match attached",
                detail=f"{memory_match.summary} Source: {memory_match.sourceMeetingTitle}.",
            ),
        )
        signal_count += 1

        chunk.processingStatus = "processed"
        chunk.signalCount = signal_count


repository = MeetingStore()
