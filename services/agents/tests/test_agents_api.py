from __future__ import annotations

from fastapi.testclient import TestClient

import visualsprint_agents.reasoning as reasoning_module
import visualsprint_agents.summary as summary_module
from visualsprint_agents.models import (
    ChunkInsightRequest,
    FinalReportDraft,
    ReasoningRunResponse,
    SummaryPacketRequest,
)
from visualsprint_agents.config import build_settings
from visualsprint_agents.main import app


def test_agents_health_reasoning_and_summary():
    with TestClient(app) as client:
        health_response = client.get("/api/health")
        assert health_response.status_code == 200
        health_payload = health_response.json()
        assert health_payload["service"] == "visualsprint-agents"
        assert health_payload["mode"] == "mock"
        assert health_payload["reasoningAgentConfigured"] is False
        assert health_payload["summaryAgentConfigured"] is False
        assert health_payload["reasoningEndpointConfigured"] is False
        assert health_payload["summaryEndpointConfigured"] is False
        assert health_payload["bridgeAuthConfigured"] is False
        assert health_payload["elasticMcpConfigured"] is False

        reasoning_response = client.post(
            "/api/reasoning/chunks/run",
            json={
                "meetingId": "mtg_agents_001",
                "meetingTitle": "Planning sync",
                "meetingNotes": "Track delivery risk.",
                "clientChunkId": "client-chunk-agents-001",
                "focusSummary": "Chunk 1 centers on release stability.",
                "attentionFlags": ["Flag"],
                "reasoningChecklist": ["Checklist"],
                "focusAreas": [
                    {
                        "recordType": "decision",
                        "summary": "Release stability",
                        "detail": "The team needs a concrete decision.",
                        "evidence": ["Jordan: We should decide today."],
                    }
                ],
            },
        )
        assert reasoning_response.status_code == 200
        reasoning_payload = reasoning_response.json()
        assert reasoning_payload["clientChunkId"] == "client-chunk-agents-001"
        assert len(reasoning_payload["decisions"]) == 1

        summary_response = client.post(
            "/api/summary/meetings/run",
            json={
                "meetingId": "mtg_agents_001",
                "meetingTitle": "Planning sync",
                "meetingStatus": "ended",
                "draftExecutiveSummary": "This meeting produced durable outcomes.",
                "decisions": [
                    {
                        "title": "Decide on release stability",
                        "rationale": "The team aligned on a concrete direction.",
                        "speakerLabel": "ReasoningAgent",
                        "status": "open",
                    }
                ],
                "commitments": [],
                "blockers": [],
                "openQuestions": [],
                "memoryHighlights": [],
            },
        )
        assert summary_response.status_code == 200
        summary_payload = summary_response.json()
        assert summary_payload["meetingId"] == "mtg_agents_001"
        assert "durable outcomes" in summary_payload["executiveSummary"]


def test_build_settings_supports_configured_cloud_mode():
    settings = build_settings(
        {
            "VISUALSPRINT_ENV": "production",
            "VISUALSPRINT_TRACK": "elastic",
            "VISUALSPRINT_AGENT_MODE": "configured_cloud",
            "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID": "demo-project",
            "VISUALSPRINT_GOOGLE_CLOUD_LOCATION": "us-central1",
            "VISUALSPRINT_AGENT_APPLICATION_ID": "agents-app",
            "VISUALSPRINT_REASONING_AGENT_ID": "reasoning-agent",
            "VISUALSPRINT_SUMMARY_AGENT_ID": "summary-agent",
            "VISUALSPRINT_REASONING_AGENT_ENDPOINT_URL": "https://agents.example/reasoning",
            "VISUALSPRINT_SUMMARY_AGENT_ENDPOINT_URL": "https://agents.example/summary",
            "VISUALSPRINT_AGENT_BRIDGE_BEARER_TOKEN": "secret-token",
            "VISUALSPRINT_ELASTIC_MCP_ENDPOINT": "https://elastic.example/mcp",
            "VISUALSPRINT_ELASTIC_API_KEY_SECRET_NAME": "elastic-api-key",
            "VISUALSPRINT_SERVICE_ACCOUNT_EMAIL": "svc@demo-project.iam.gserviceaccount.com",
        }
    )

    assert settings.environment == "production"
    assert settings.agent_mode == "configured_cloud"
    assert settings.reasoning_agent_configured is True
    assert settings.summary_agent_configured is True
    assert settings.reasoning_endpoint_configured is True
    assert settings.summary_endpoint_configured is True
    assert settings.bridge_auth_configured is True
    assert settings.elastic_mcp_configured is True
    assert settings.cloud_adapter_ready is True


def test_configured_cloud_reasoning_and_summary_use_bridge_before_fallback(monkeypatch):
    bridge_settings = build_settings(
        {
            "VISUALSPRINT_AGENT_MODE": "configured_cloud",
            "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID": "demo-project",
            "VISUALSPRINT_REASONING_AGENT_ID": "reasoning-agent",
            "VISUALSPRINT_SUMMARY_AGENT_ID": "summary-agent",
            "VISUALSPRINT_REASONING_AGENT_ENDPOINT_URL": "https://agents.example/reasoning",
            "VISUALSPRINT_SUMMARY_AGENT_ENDPOINT_URL": "https://agents.example/summary",
        }
    )

    monkeypatch.setattr(reasoning_module, "settings", bridge_settings)
    monkeypatch.setattr(summary_module, "settings", bridge_settings)
    monkeypatch.setattr(
        reasoning_module,
        "invoke_reasoning_agent",
        lambda payload: ReasoningRunResponse(
            clientChunkId=payload.clientChunkId,
            decisions=[],
            commitments=[],
            blockers=[],
            openQuestions=[],
            memoryMatches=[],
            resolvedDecisionIds=[],
            resolvedCommitmentIds=[],
            resolvedBlockerIds=[],
            resolvedOpenQuestionIds=[],
        ),
    )
    monkeypatch.setattr(
        summary_module,
        "invoke_summary_agent",
        lambda payload: FinalReportDraft(
            meetingId=payload.meetingId,
            generatedAt="2026-06-07T10:00:00Z",
            executiveSummary="Bridge response summary.",
            decisions=payload.decisions,
            commitments=payload.commitments,
            blockers=payload.blockers,
            openQuestions=payload.openQuestions,
            memoryHighlights=payload.memoryHighlights,
        ),
    )

    reasoning_response = reasoning_module.run_reasoning_agent(
        ChunkInsightRequest(
            meetingId="mtg_bridge_001",
            meetingTitle="Bridge sync",
            meetingNotes="",
            clientChunkId="client-chunk-bridge-001",
            focusSummary="Bridge path should be used first.",
            attentionFlags=[],
            reasoningChecklist=[],
            focusAreas=[],
        )
    )
    assert reasoning_response.clientChunkId == "client-chunk-bridge-001"

    summary_response = summary_module.run_summary_agent(
        SummaryPacketRequest(
            meetingId="mtg_bridge_001",
            meetingTitle="Bridge sync",
            meetingStatus="ended",
            draftExecutiveSummary="Bridge path summary.",
            decisions=[],
            commitments=[],
            blockers=[],
            openQuestions=[],
            memoryHighlights=[],
        )
    )
    assert summary_response.executiveSummary == "Bridge response summary."


def test_configured_cloud_falls_back_when_bridge_returns_none(monkeypatch):
    bridge_settings = build_settings(
        {
            "VISUALSPRINT_AGENT_MODE": "configured_cloud",
            "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID": "demo-project",
            "VISUALSPRINT_REASONING_AGENT_ID": "reasoning-agent",
            "VISUALSPRINT_SUMMARY_AGENT_ID": "summary-agent",
            "VISUALSPRINT_REASONING_AGENT_ENDPOINT_URL": "https://agents.example/reasoning",
            "VISUALSPRINT_SUMMARY_AGENT_ENDPOINT_URL": "https://agents.example/summary",
        }
    )

    monkeypatch.setattr(reasoning_module, "settings", bridge_settings)
    monkeypatch.setattr(summary_module, "settings", bridge_settings)
    monkeypatch.setattr(reasoning_module, "invoke_reasoning_agent", lambda payload: None)
    monkeypatch.setattr(summary_module, "invoke_summary_agent", lambda payload: None)

    reasoning_response = reasoning_module.run_reasoning_agent(
        ChunkInsightRequest(
            meetingId="mtg_fallback_001",
            meetingTitle="Fallback sync",
            meetingNotes="",
            clientChunkId="client-chunk-fallback-001",
            focusSummary="Fallback path should produce a deterministic decision.",
            attentionFlags=[],
            reasoningChecklist=[],
            focusAreas=[],
        )
    )
    assert len(reasoning_response.decisions) == 1

    summary_response = summary_module.run_summary_agent(
        SummaryPacketRequest(
            meetingId="mtg_fallback_001",
            meetingTitle="Fallback sync",
            meetingStatus="ended",
            draftExecutiveSummary="Fallback summary path.",
            decisions=[],
            commitments=[],
            blockers=[],
            openQuestions=[],
            memoryHighlights=[],
        )
    )
    assert "Fallback summary path." in summary_response.executiveSummary
