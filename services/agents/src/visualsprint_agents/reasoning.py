"""Deterministic reasoning-agent stub for development."""

from __future__ import annotations

from visualsprint_agents.models import (
    AgentBlockerInput,
    AgentCommitmentInput,
    AgentDecisionInput,
    AgentMemoryMatchInput,
    AgentOpenQuestionInput,
    ChunkInsightRequest,
    ReasoningRunResponse,
)


def run_reasoning_agent(payload: ChunkInsightRequest) -> ReasoningRunResponse:
    """Generate deterministic reasoning outputs from the assembled insight."""

    decision_summary = payload.focusAreas[0].summary if payload.focusAreas else payload.focusSummary
    primary_detail = payload.focusAreas[0].detail if payload.focusAreas else payload.focusSummary
    decision = AgentDecisionInput(
        title=f"Decide on {decision_summary.lower()}",
        rationale=primary_detail,
        speakerLabel="ReasoningAgent",
    )

    commitment = AgentCommitmentInput(
        ownerLabel="Jordan",
        action="Publish the next-step handoff in the engineering channel",
        dueHint="Today",
    )

    blocker = AgentBlockerInput(
        summary="A recurring delivery risk still needs explicit owner confirmation.",
        severity="medium",
        ownerLabel="Mina",
    )

    open_question = AgentOpenQuestionInput(
        question="Which team confirms the final readiness gate before this topic is closed?",
        speakerLabel="ReasoningAgent",
    )

    memory_match = AgentMemoryMatchInput(
        sourceMeetingId=f"{payload.meetingId}_memory_stub",
        summary="A similar outcome appeared in a recent planning conversation.",
        sourceMeetingTitle=f"{payload.meetingTitle} memory context",
        strength="related",
        relation="recurring",
        score=0.71,
        snippet="A prior meeting raised a similar risk and required an explicit owner follow-up.",
    )

    return ReasoningRunResponse(
        clientChunkId=payload.clientChunkId,
        decisions=[decision],
        commitments=[commitment],
        blockers=[blocker],
        openQuestions=[open_question],
        memoryMatches=[memory_match],
    )
