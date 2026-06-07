"""Adapters for deterministic ingest and media service boundaries."""

from __future__ import annotations

import json
from urllib import error, request

from visualsprint_api.config import settings
from visualsprint_api.media_pipeline import build_screen_events
from visualsprint_api.models import (
    AgentInvocationAuditResponse,
    AgentInvocationAuditSummary,
    CaptureChunkSummary,
    CaptureChunkUploadTarget,
    FinalReport,
    MeetingSummaryPacket,
    ProcessingSourceMode,
    RegisterAgentOutputsRequest,
    ScreenEvent,
    TranscriptSegment,
    ChunkInsight,
)
from visualsprint_api.transcript_pipeline import build_transcript_segments


def reserve_chunk_upload_target(
    *,
    meeting_id: str,
    capture_session_id: str,
    client_chunk_id: str,
    sequence: int,
    mime_type: str,
) -> CaptureChunkUploadTarget:
    """Use the ingest service for upload reservation when available, otherwise build locally."""

    if not settings.ingest_service_url:
        return _build_local_upload_target(
            meeting_id=meeting_id,
            capture_session_id=capture_session_id,
            client_chunk_id=client_chunk_id,
            mime_type=mime_type,
        )

    payload = {
        "meetingId": meeting_id,
        "captureSessionId": capture_session_id,
        "clientChunkId": client_chunk_id,
        "sequence": sequence,
        "mimeType": mime_type,
    }

    try:
        response_payload = _post_json(
            f"{settings.ingest_service_url.rstrip('/')}/api/uploads/chunks/reserve",
            payload,
        )
        return CaptureChunkUploadTarget.model_validate(response_payload["uploadTarget"])
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return _build_local_upload_target(
            meeting_id=meeting_id,
            capture_session_id=capture_session_id,
            client_chunk_id=client_chunk_id,
            mime_type=mime_type,
        )


def process_transcript_chunk(chunk: CaptureChunkSummary) -> list[TranscriptSegment]:
    """Use the ingest service when available, otherwise fall back locally."""

    if not settings.ingest_service_url:
        return build_transcript_segments(chunk)

    payload = {
        "chunkId": chunk.id,
        "clientChunkId": chunk.clientChunkId,
        "sequence": chunk.sequence,
        "recordedAt": chunk.recordedAt.isoformat(),
        "durationMs": chunk.durationMs,
        "mimeType": chunk.mimeType,
    }

    try:
        response_payload = _post_json(
            f"{settings.ingest_service_url.rstrip('/')}/api/transcript/chunks/process",
            payload,
        )
        return [
            TranscriptSegment.model_validate(segment)
            for segment in response_payload["transcriptSegments"]
        ]
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return build_transcript_segments(chunk)


def process_transcript_chunk_with_source(
    chunk: CaptureChunkSummary,
) -> tuple[list[TranscriptSegment], ProcessingSourceMode]:
    if not settings.ingest_service_url:
        return build_transcript_segments(chunk), "local_fallback"

    payload = {
        "chunkId": chunk.id,
        "clientChunkId": chunk.clientChunkId,
        "sequence": chunk.sequence,
        "recordedAt": chunk.recordedAt.isoformat(),
        "durationMs": chunk.durationMs,
        "mimeType": chunk.mimeType,
    }

    try:
        response_payload = _post_json(
            f"{settings.ingest_service_url.rstrip('/')}/api/transcript/chunks/process",
            payload,
        )
        return (
            [
                TranscriptSegment.model_validate(segment)
                for segment in response_payload["transcriptSegments"]
            ],
            "downstream_service",
        )
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return build_transcript_segments(chunk), "local_fallback"


def process_media_chunk(chunk: CaptureChunkSummary) -> tuple[int, list[ScreenEvent]]:
    """Use the media service when available, otherwise fall back locally."""

    if not settings.media_service_url:
        return build_screen_events(chunk)

    payload = {
        "chunkId": chunk.id,
        "clientChunkId": chunk.clientChunkId,
        "sequence": chunk.sequence,
        "recordedAt": chunk.recordedAt.isoformat(),
        "durationMs": chunk.durationMs,
        "mimeType": chunk.mimeType,
    }

    try:
        response_payload = _post_json(
            f"{settings.media_service_url.rstrip('/')}/api/media/chunks/process",
            payload,
        )
        return (
            int(response_payload["frameCount"]),
            [
                ScreenEvent.model_validate(screen_event)
                for screen_event in response_payload["screenEvents"]
            ],
        )
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        return build_screen_events(chunk)


def process_media_chunk_with_source(
    chunk: CaptureChunkSummary,
) -> tuple[int, list[ScreenEvent], ProcessingSourceMode]:
    if not settings.media_service_url:
        frame_count, screen_events = build_screen_events(chunk)
        return frame_count, screen_events, "local_fallback"

    payload = {
        "chunkId": chunk.id,
        "clientChunkId": chunk.clientChunkId,
        "sequence": chunk.sequence,
        "recordedAt": chunk.recordedAt.isoformat(),
        "durationMs": chunk.durationMs,
        "mimeType": chunk.mimeType,
    }

    try:
        response_payload = _post_json(
            f"{settings.media_service_url.rstrip('/')}/api/media/chunks/process",
            payload,
        )
        return (
            int(response_payload["frameCount"]),
            [
                ScreenEvent.model_validate(screen_event)
                for screen_event in response_payload["screenEvents"]
            ],
            "downstream_service",
        )
    except (KeyError, ValueError, error.URLError, error.HTTPError):
        frame_count, screen_events = build_screen_events(chunk)
        return frame_count, screen_events, "local_fallback"


def run_chunk_reasoning(insight: ChunkInsight) -> RegisterAgentOutputsRequest | None:
    """Call the agents service for chunk reasoning when configured."""

    if not settings.agents_service_url:
        return None

    try:
        response_payload = _post_json(
            f"{settings.agents_service_url.rstrip('/')}/api/reasoning/chunks/run",
            insight.model_dump(mode="json"),
        )
        return RegisterAgentOutputsRequest.model_validate(response_payload)
    except (ValueError, error.URLError, error.HTTPError):
        return None


def run_chunk_reasoning_with_source(
    insight: ChunkInsight,
) -> tuple[RegisterAgentOutputsRequest | None, ProcessingSourceMode]:
    payload = run_chunk_reasoning(insight)
    if payload is None:
        return None, "local_fallback"
    return payload, "downstream_service"


def run_summary_agent(packet: MeetingSummaryPacket) -> FinalReport | None:
    """Call the agents service for end-of-meeting summary generation when configured."""

    if not settings.agents_service_url:
        return None

    try:
        response_payload = _post_json(
            f"{settings.agents_service_url.rstrip('/')}/api/summary/meetings/run",
            packet.model_dump(mode="json"),
        )
        return FinalReport(
            meetingId=packet.meetingId,
            generatedAt=response_payload["generatedAt"],
            executiveSummary=response_payload["executiveSummary"],
            decisions=packet.decisions,
            commitments=packet.commitments,
            blockers=packet.blockers,
            openQuestions=packet.openQuestions,
            memoryHighlights=packet.memoryHighlights,
        )
    except (ValueError, error.URLError, error.HTTPError):
        return None


def run_summary_agent_with_source(
    packet: MeetingSummaryPacket,
) -> tuple[FinalReport | None, ProcessingSourceMode]:
    report = run_summary_agent(packet)
    if report is None:
        return None, "local_fallback"
    return report, "downstream_service"


def get_agents_invocation_audit() -> AgentInvocationAuditResponse:
    """Fetch the agents invocation audit when the service is configured."""

    if not settings.agents_service_url:
        return AgentInvocationAuditResponse(
            summary=AgentInvocationAuditSummary(
                available=False,
                source="local_unavailable",
                note=(
                    "The standalone agents service is not configured, so invocation audit "
                    "data is not available through the control plane."
                ),
            ),
            invocations=[],
        )

    try:
        response_payload = _get_json(
            f"{settings.agents_service_url.rstrip('/')}/api/audit/invocations"
        )
        return AgentInvocationAuditResponse(
            summary=AgentInvocationAuditSummary(
                available=True,
                source="agents_service",
                total=int(response_payload["summary"]["total"]),
                reasoningRuns=int(response_payload["summary"]["reasoningRuns"]),
                summaryRuns=int(response_payload["summary"]["summaryRuns"]),
                bridgeRuns=int(response_payload["summary"]["bridgeRuns"]),
                bridgeFallbackRuns=int(response_payload["summary"]["bridgeFallbackRuns"]),
                mockRuns=int(response_payload["summary"]["mockRuns"]),
                note="The standalone agents service provided recent invocation audit data.",
            ),
            invocations=response_payload.get("invocations", []),
        )
    except (ValueError, KeyError, error.URLError, error.HTTPError):
        return AgentInvocationAuditResponse(
            summary=AgentInvocationAuditSummary(
                available=False,
                source="local_unavailable",
                note=(
                    "The agents service is configured but its invocation audit endpoint "
                    "is unavailable right now."
                ),
            ),
            invocations=[],
        )


def _post_json(url: str, payload: dict) -> dict:
    response = request.urlopen(
        request.Request(
            url=url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        ),
        timeout=settings.service_request_timeout_seconds,
    )
    response_bytes = response.read()
    return json.loads(response_bytes.decode("utf-8"))


def _get_json(url: str) -> dict:
    response = request.urlopen(
        request.Request(url=url, headers={"Content-Type": "application/json"}, method="GET"),
        timeout=settings.service_request_timeout_seconds,
    )
    response_bytes = response.read()
    return json.loads(response_bytes.decode("utf-8"))


def _build_local_upload_target(
    *,
    meeting_id: str,
    capture_session_id: str,
    client_chunk_id: str,
    mime_type: str,
) -> CaptureChunkUploadTarget:
    object_path = (
        f"meetings/{meeting_id}/capture-sessions/"
        f"{capture_session_id}/chunks/{client_chunk_id}.webm"
    )
    return CaptureChunkUploadTarget(
        objectPath=object_path,
        requiredHeaders={
            "Content-Type": mime_type,
            "X-VisualSprint-Chunk-Id": client_chunk_id,
        },
    )
