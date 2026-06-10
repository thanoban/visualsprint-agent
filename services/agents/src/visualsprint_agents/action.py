"""Deterministic action-agent stub for development."""

from __future__ import annotations

from visualsprint_agents.agent_runtime import invoke_action_agent
from visualsprint_agents.config import settings
from visualsprint_agents.invocation_audit import audit_store
from visualsprint_agents.models import (
    ActionAgentRequest,
    ActionAgentResponse,
    AgentActionRecommendationInput,
    AgentJiraRecommendationInput,
    AgentSlackRecommendationInput,
)


def _recommendation_dedupe_key(
    recommendation: AgentActionRecommendationInput,
) -> tuple[str, str]:
    if recommendation.jiraDetails is not None:
        return recommendation.type, recommendation.jiraDetails.title
    if recommendation.slackDetails is not None:
        return recommendation.type, recommendation.slackDetails.title
    return recommendation.type, ""


def _dedupe_recommendations(
    recommendations: list[AgentActionRecommendationInput],
) -> list[AgentActionRecommendationInput]:
    seen: set[tuple[str, str]] = set()
    unique: list[AgentActionRecommendationInput] = []
    for recommendation in recommendations:
        key = _recommendation_dedupe_key(recommendation)
        if key in seen:
            continue
        seen.add(key)
        unique.append(recommendation)
    return unique


def run_action_agent(payload: ActionAgentRequest) -> ActionAgentResponse:
    """Generate action recommendations through the active adapter mode."""

    if settings.cloud_adapter_ready:
        cloud_response = invoke_action_agent(payload)
        if cloud_response is not None and cloud_response.recommendations:
            audit_store.record(
                agent_kind="action",
                execution_mode=(
                    "vertex_ai"
                    if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                    else "bridge"
                ),
                status="success",
                target_agent_id=(
                    settings.action_engine_resource_name
                    if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                    else settings.action_agent_id
                ),
                request_key=payload.meetingId,
                detail=(
                    "Configured Vertex AI runtime produced the action response."
                    if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                    else "Configured bridge produced the action response."
                ),
            )
            return cloud_response

        empty_vertex_response = (
            cloud_response is not None and not cloud_response.recommendations
        )
        audit_store.record(
            agent_kind="action",
            execution_mode=(
                "vertex_ai_fallback"
                if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else "bridge_fallback"
            ),
            status="fallback",
            target_agent_id=(
                settings.action_engine_resource_name
                if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else settings.action_agent_id
            ),
            request_key=payload.meetingId,
            detail=(
                "Configured Vertex AI runtime returned no recommendations, so deterministic action fallback was used."
                if empty_vertex_response
                and settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else "Configured bridge returned no recommendations, so deterministic action fallback was used."
                if empty_vertex_response
                else "Configured Vertex AI runtime was unavailable, so deterministic action fallback was used."
                if settings.agent_runtime_backend == "vertex_ai_reasoning_engine"
                else "Configured bridge was unavailable, so deterministic action fallback was used."
            ),
        )
        return _run_configured_action_agent_stub(payload)
    audit_store.record(
        agent_kind="action",
        execution_mode="mock",
        status="success",
        target_agent_id=None,
        request_key=payload.meetingId,
        detail="Deterministic mock action path handled the request.",
    )
    return _run_mock_action_agent(payload)


def _run_mock_action_agent(payload: ActionAgentRequest) -> ActionAgentResponse:
    """Generate deterministic action recommendations from the final report."""

    recommendations: list[AgentActionRecommendationInput] = []

    for decision in payload.decisions:
        recommendations.append(
            AgentActionRecommendationInput(
                type="slack_broadcast_decision",
                urgency="medium",
                confidence=0.82,
                slackDetails=AgentSlackRecommendationInput(
                    type="broadcast_decision",
                    title=f"Decision: {decision.title}",
                    message=decision.rationale,
                    evidence=[],
                    confidence=0.82,
                ),
                evidence=[],
            )
        )

    for commitment in payload.commitments:
        recommendations.append(
            AgentActionRecommendationInput(
                type="jira_create_issue",
                urgency="high" if commitment.dueHint == "Today" else "medium",
                confidence=0.88,
                jiraDetails=AgentJiraRecommendationInput(
                    action="create_issue",
                    issueType="task",
                    title=commitment.action,
                    description=f"Owner: {commitment.ownerLabel}. Due: {commitment.dueHint}.",
                    ownerLabel=commitment.ownerLabel,
                    evidence=[],
                    confidence=0.88,
                ),
                evidence=[],
            )
        )
        recommendations.append(
            AgentActionRecommendationInput(
                type="slack_remind_commitment",
                urgency="medium",
                confidence=0.75,
                slackDetails=AgentSlackRecommendationInput(
                    type="remind_commitment",
                    title=f"Commitment reminder: {commitment.action}",
                    message=f"{commitment.ownerLabel} committed to: {commitment.action} (due {commitment.dueHint}).",
                    evidence=[],
                    confidence=0.75,
                ),
                evidence=[],
            )
        )

    for blocker in payload.blockers:
        recommendations.append(
            AgentActionRecommendationInput(
                type="jira_create_issue",
                urgency="critical" if blocker.severity == "high" else "high",
                confidence=0.91,
                jiraDetails=AgentJiraRecommendationInput(
                    action="create_issue",
                    issueType="bug",
                    title=blocker.summary,
                    description=f"Severity: {blocker.severity}. Owner: {blocker.ownerLabel}.",
                    ownerLabel=blocker.ownerLabel,
                    evidence=[],
                    confidence=0.91,
                ),
                evidence=[],
            )
        )
        if blocker.severity == "high":
            recommendations.append(
                AgentActionRecommendationInput(
                    type="slack_alert_blocker",
                    urgency="critical",
                    confidence=0.85,
                    slackDetails=AgentSlackRecommendationInput(
                        type="alert_blocker",
                        title=f"Blocker alert: {blocker.summary}",
                        message=f"High severity blocker identified: {blocker.summary}. Owner: {blocker.ownerLabel}.",
                        evidence=[],
                        confidence=0.85,
                    ),
                    evidence=[],
                )
            )

    for open_question in payload.openQuestions:
        recommendations.append(
            AgentActionRecommendationInput(
                type="jira_create_issue",
                urgency="medium",
                confidence=0.80,
                jiraDetails=AgentJiraRecommendationInput(
                    action="create_issue",
                    issueType="task",
                    title=open_question.question,
                    description=(
                        f"Open question from meeting '{payload.meetingTitle}'. "
                        f"Raised by: {open_question.speakerLabel}."
                    ),
                    ownerLabel=open_question.speakerLabel,
                    evidence=[],
                    confidence=0.80,
                ),
                evidence=[],
            )
        )

    if payload.blockers or payload.commitments or payload.decisions or payload.openQuestions:
        recommendations.append(
            AgentActionRecommendationInput(
                type="slack_post_summary",
                urgency="low",
                confidence=0.70,
                slackDetails=AgentSlackRecommendationInput(
                    type="post_summary",
                    title=f"Meeting summary: {payload.meetingTitle}",
                    message=payload.executiveSummary,
                    evidence=[],
                    confidence=0.70,
                ),
                evidence=[],
            )
        )

    return ActionAgentResponse(
        meetingId=payload.meetingId,
        recommendations=_dedupe_recommendations(recommendations),
    )


def _run_configured_action_agent_stub(payload: ActionAgentRequest) -> ActionAgentResponse:
    """Keep the response schema stable until the real SDK/tool-calling path lands."""

    return _run_mock_action_agent(payload)
