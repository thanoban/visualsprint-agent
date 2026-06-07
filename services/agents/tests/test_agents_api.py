from __future__ import annotations

from fastapi.testclient import TestClient

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
            "VISUALSPRINT_ELASTIC_MCP_ENDPOINT": "https://elastic.example/mcp",
            "VISUALSPRINT_ELASTIC_API_KEY_SECRET_NAME": "elastic-api-key",
            "VISUALSPRINT_SERVICE_ACCOUNT_EMAIL": "svc@demo-project.iam.gserviceaccount.com",
        }
    )

    assert settings.environment == "production"
    assert settings.agent_mode == "configured_cloud"
    assert settings.reasoning_agent_configured is True
    assert settings.summary_agent_configured is True
    assert settings.elastic_mcp_configured is True
    assert settings.cloud_adapter_ready is True
