"""Agent-adapter inspection routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from visualsprint_api.models import (
    AgentInvocationAuditResponse,
    AgentSmokeResponse,
    AgentSmokeReasoningResult,
    AgentSmokeSummaryResult,
)
from visualsprint_api.repository import repository
from visualsprint_api.service_clients import (
    get_agents_invocation_audit,
    run_chunk_reasoning_with_source,
    run_summary_agent_with_source,
)

router = APIRouter(tags=["agents"])


@router.get("/meta/agents/invocations", response_model=AgentInvocationAuditResponse)
def get_agent_invocation_audit() -> AgentInvocationAuditResponse:
    return get_agents_invocation_audit()


@router.post("/meetings/{meeting_id}/agents/smoke", response_model=AgentSmokeResponse)
def run_agent_smoke(
    meeting_id: str,
    client_chunk_id: str | None = Query(default=None, alias="clientChunkId"),
) -> AgentSmokeResponse:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    summary_packet = repository.get_summary_packet(meeting_id)
    if summary_packet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary packet not found")

    selected_chunk_id = client_chunk_id
    if selected_chunk_id is None:
        selected_chunk = next(
            (
                chunk
                for chunk in meeting.recentCaptureChunks
                if chunk.processingStatus == "processed"
            ),
            None,
        )
        selected_chunk_id = None if selected_chunk is None else selected_chunk.clientChunkId

    reasoning_result = AgentSmokeReasoningResult(
        attempted=False,
        selectedChunkId=selected_chunk_id,
        source="local_fallback",
        producedOutput=False,
        note="No processed chunk was available to exercise the reasoning adapter seam.",
    )
    if selected_chunk_id is not None:
        insight = repository.get_chunk_insight(meeting_id, selected_chunk_id)
        if insight is not None:
            reasoning_payload, reasoning_source = run_chunk_reasoning_with_source(insight)
            reasoning_result = AgentSmokeReasoningResult(
                attempted=True,
                selectedChunkId=selected_chunk_id,
                source=reasoning_source,
                producedOutput=reasoning_payload is not None,
                decisionCount=0 if reasoning_payload is None else len(reasoning_payload.decisions),
                commitmentCount=0
                if reasoning_payload is None
                else len(reasoning_payload.commitments),
                blockerCount=0 if reasoning_payload is None else len(reasoning_payload.blockers),
                openQuestionCount=0
                if reasoning_payload is None
                else len(reasoning_payload.openQuestions),
                memoryMatchCount=0
                if reasoning_payload is None
                else len(reasoning_payload.memoryMatches),
                note=(
                    "The control plane exercised the assembled chunk insight against the agent "
                    "adapter seam without persisting new outputs."
                ),
            )

    summary_payload, summary_source = run_summary_agent_with_source(summary_packet)
    summary_result = AgentSmokeSummaryResult(
        attempted=True,
        source=summary_source,
        producedOutput=summary_payload is not None,
        executiveSummaryLength=0
        if summary_payload is None
        else len(summary_payload.executiveSummary),
        note=(
            "The control plane exercised the assembled meeting summary packet against the "
            "summary adapter seam without writing a final report."
        ),
    )

    return AgentSmokeResponse(
        meetingId=meeting_id,
        reasoning=reasoning_result,
        summary=summary_result,
    )
