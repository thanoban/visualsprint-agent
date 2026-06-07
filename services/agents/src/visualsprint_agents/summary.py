"""Deterministic summary-agent stub for development."""

from __future__ import annotations

from datetime import datetime, timezone

from visualsprint_agents.agent_runtime import invoke_summary_agent
from visualsprint_agents.config import settings
from visualsprint_agents.models import FinalReportDraft, SummaryPacketRequest


def run_summary_agent(payload: SummaryPacketRequest) -> FinalReportDraft:
    """Generate a final report draft through the active adapter mode."""

    if settings.cloud_adapter_ready:
        cloud_response = invoke_summary_agent(payload)
        if cloud_response is not None:
            return cloud_response
        return _run_configured_summary_agent_stub(payload)
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
