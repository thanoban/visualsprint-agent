from __future__ import annotations

from fastapi.testclient import TestClient

from visualsprint_agents.main import app


def test_agents_health_reasoning_and_summary():
    with TestClient(app) as client:
        health_response = client.get("/api/health")
        assert health_response.status_code == 200
        assert health_response.json()["service"] == "visualsprint-agents"

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
