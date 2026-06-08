"""Deterministic summary-agent stub for development."""

from __future__ import annotations

from datetime import datetime, timezone

from visualsprint_agents.agent_runtime import invoke_summary_agent
from visualsprint_agents.config import settings
from visualsprint_agents.invocation_audit import audit_store
from visualsprint_agents.models import FinalReportDraft, SummaryPacketRequest


def run_summary_agent(payload: SummaryPacketRequest) -> FinalReportDraft:
    """Generate a final report draft through the active adapter mode."""

    if settings.cloud_adapter_ready:
        cloud_response = invoke_summary_agent(payload)
        if cloud_response is not None:
            audit_store.record(
                agent_kind="summary",
                execution_mode=(
                    "vertex_ai"
                    if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                    else "bridge"
                ),
                status="success",
                target_agent_id=(
                    settings.summary_engine_resource_name
                    if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                    else settings.summary_agent_id
                ),
                request_key=payload.meetingId,
                detail=(
                    "Configured Vertex AI runtime produced the summary response."
                    if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                    else "Configured bridge produced the summary response."
                ),
            )
            return cloud_response
        audit_store.record(
            agent_kind="summary",
            execution_mode=(
                "vertex_ai_fallback"
                if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else "bridge_fallback"
            ),
            status="fallback",
            target_agent_id=(
                settings.summary_engine_resource_name
                if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else settings.summary_agent_id
            ),
            request_key=payload.meetingId,
            detail=(
                "Configured Vertex AI runtime was unavailable, so deterministic summary fallback was used."
                if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else "Configured bridge was unavailable, so deterministic summary fallback was used."
            ),
        )
        return _run_configured_summary_agent_stub(payload)
    audit_store.record(
        agent_kind="summary",
        execution_mode="mock",
        status="success",
        target_agent_id=None,
        request_key=payload.meetingId,
        detail="Deterministic mock summary path handled the request.",
    )
    return _run_mock_summary_agent(payload)


def _run_mock_summary_agent(payload: SummaryPacketRequest) -> FinalReportDraft:
    """Generate a deterministic final report draft from the summary packet."""

    summary_parts = [
        payload.draftExecutiveSummary,
        f"The summary draft includes {len(payload.decisions)} decisions, {len(payload.commitments)} commitments, and {len(payload.blockers)} blockers.",
    ]
    if payload.openQuestions:
        summary_parts.append(f"{len(payload.openQuestions)} open questions remain visible for follow-up.")
    if payload.memoryHighlights:
        summary_parts.append("Historical memory matches were considered during report synthesis.")

    return FinalReportDraft(
        meetingId=payload.meetingId,
        generatedAt=datetime.now(timezone.utc),
        executiveSummary=" ".join(summary_parts),
        decisions=payload.decisions,
        commitments=payload.commitments,
        blockers=payload.blockers,
        openQuestions=payload.openQuestions,
        memoryHighlights=payload.memoryHighlights,
    )


def _run_configured_summary_agent_stub(payload: SummaryPacketRequest) -> FinalReportDraft:
    """Keep the current contract stable until the real Google Cloud call path lands."""

    return _run_mock_summary_agent(payload)
