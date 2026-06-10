from __future__ import annotations

import visualsprint_agents.action as action_module
from visualsprint_agents.action import run_action_agent
from visualsprint_agents.config import build_settings
from visualsprint_agents.invocation_audit import audit_store
from visualsprint_agents.models import (
    ActionAgentRequest,
    ActionAgentResponse,
    AgentActionRecommendationInput,
    AgentJiraRecommendationInput,
    AgentSlackRecommendationInput,
)


def _cloud_settings():
    return build_settings(
        {
            "VISUALSPRINT_AGENT_MODE": "configured_cloud",
            "VISUALSPRINT_AGENT_RUNTIME_BACKEND": "vertex_ai_reasoning_engine",
            "VISUALSPRINT_DEPLOYMENT_TARGET": "cloud_run",
            "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID": "demo-project",
            "VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME": "projects/demo/locations/us-central1/reasoningEngines/action789",
            "VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME": "projects/demo/locations/us-central1/reasoningEngines/reasoning123",
            "VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME": "projects/demo/locations/us-central1/reasoningEngines/summary456",
        }
    )


def _actionable_payload() -> ActionAgentRequest:
    return ActionAgentRequest(
        meetingId="mtg_action_001",
        meetingTitle="Release readiness sync",
        executiveSummary="The team aligned on release blockers and follow-up tasks.",
        decisions=[
            {
                "title": "Ship the rollback plan before deploy",
                "rationale": "Rollback readiness must be explicit before release.",
                "speakerLabel": "Jordan",
                "status": "open",
            }
        ],
        commitments=[
            {
                "ownerLabel": "Mina",
                "action": "Attach rollout verification checklist to the ticket",
                "dueHint": "Today",
                "status": "open",
            }
        ],
        blockers=[
            {
                "summary": "Auth drift is still blocking release",
                "severity": "high",
                "ownerLabel": "Platform",
                "status": "open",
            }
        ],
        openQuestions=[
            {
                "question": "Who signs off on rollback readiness?",
                "speakerLabel": "Avery",
                "status": "open",
            }
        ],
    )


def _vertex_recommendation() -> AgentActionRecommendationInput:
    return AgentActionRecommendationInput(
        type="jira_create_issue",
        urgency="high",
        confidence=0.95,
        jiraDetails=AgentJiraRecommendationInput(
            action="create_issue",
            issueType="task",
            title="Vertex-generated follow-up",
            description="Created by Vertex action agent.",
            ownerLabel="Vertex",
            evidence=[],
            confidence=0.95,
        ),
        evidence=[],
    )


def _configure_cloud_mode(monkeypatch) -> None:
    settings = _cloud_settings()
    monkeypatch.setattr(action_module, "settings", settings)
    audit_store.clear()


def test_vertex_non_empty_recommendations_skip_fallback(monkeypatch):
    _configure_cloud_mode(monkeypatch)
    vertex_response = ActionAgentResponse(
        meetingId="mtg_action_001",
        recommendations=[_vertex_recommendation()],
    )
    monkeypatch.setattr(action_module, "invoke_action_agent", lambda payload: vertex_response)

    response = run_action_agent(_actionable_payload())

    assert response == vertex_response
    assert len(response.recommendations) == 1
    assert response.recommendations[0].jiraDetails is not None
    assert response.recommendations[0].jiraDetails.title == "Vertex-generated follow-up"
    assert audit_store.snapshot()[0].execution_mode == "vertex_ai"
    assert audit_store.snapshot()[0].status == "success"


def test_vertex_empty_recommendations_use_fallback(monkeypatch):
    _configure_cloud_mode(monkeypatch)
    monkeypatch.setattr(
        action_module,
        "invoke_action_agent",
        lambda payload: ActionAgentResponse(
            meetingId=payload.meetingId,
            recommendations=[],
        ),
    )

    response = run_action_agent(_actionable_payload())
    recommendation_types = {item.type for item in response.recommendations}

    assert "jira_create_issue" in recommendation_types
    assert "slack_broadcast_decision" in recommendation_types
    assert "slack_post_summary" in recommendation_types
    assert audit_store.snapshot()[0].execution_mode == "vertex_ai_fallback"
    assert audit_store.snapshot()[0].status == "fallback"
    assert "returned no recommendations" in audit_store.snapshot()[0].detail


def test_vertex_failure_uses_fallback(monkeypatch):
    _configure_cloud_mode(monkeypatch)
    monkeypatch.setattr(action_module, "invoke_action_agent", lambda payload: None)

    response = run_action_agent(_actionable_payload())
    recommendation_types = {item.type for item in response.recommendations}

    assert "jira_create_issue" in recommendation_types
    assert "slack_post_summary" in recommendation_types
    assert audit_store.snapshot()[0].execution_mode == "vertex_ai_fallback"
    assert audit_store.snapshot()[0].status == "fallback"
    assert "unavailable" in audit_store.snapshot()[0].detail


def test_fallback_includes_jira_or_slack_when_report_has_actionable_content(monkeypatch):
    _configure_cloud_mode(monkeypatch)
    monkeypatch.setattr(
        action_module,
        "invoke_action_agent",
        lambda payload: ActionAgentResponse(
            meetingId=payload.meetingId,
            recommendations=[],
        ),
    )

    response = run_action_agent(_actionable_payload())
    recommendation_types = {item.type for item in response.recommendations}

    assert any(item.startswith("jira_") for item in recommendation_types)
    assert any(item.startswith("slack_") for item in recommendation_types)
    assert len(response.recommendations) == len(
        {(item.type, item.jiraDetails.title if item.jiraDetails else item.slackDetails.title) for item in response.recommendations}
    )
