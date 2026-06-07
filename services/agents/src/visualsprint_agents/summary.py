"""Deterministic summary-agent stub for development."""

from __future__ import annotations

from datetime import datetime, timezone

from visualsprint_agents.models import FinalReportDraft, SummaryPacketRequest


def run_summary_agent(payload: SummaryPacketRequest) -> FinalReportDraft:
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
