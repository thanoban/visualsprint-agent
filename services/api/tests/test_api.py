from __future__ import annotations

from fastapi.testclient import TestClient


def _create_live_browser_meeting(client: TestClient) -> str:
    create_response = client.post(
        "/api/meetings",
        json={
            "title": "Integration planning sync",
            "participantCount": 4,
            "sourceConnector": "browser_live_capture",
            "notes": "Track blockers, owners, and repeated risks.",
        },
    )
    assert create_response.status_code == 201
    meeting_id = create_response.json()["meeting"]["id"]

    start_response = client.post(f"/api/meetings/{meeting_id}/start")
    assert start_response.status_code == 200
    return meeting_id


def _start_capture_session(client: TestClient, meeting_id: str) -> dict:
    response = client.post(
        f"/api/meetings/{meeting_id}/capture-sessions/start",
        json={
            "recorderMimeType": "video/webm;codecs=vp9,opus",
            "hasDisplayVideo": True,
            "hasDisplayAudio": True,
            "hasMicrophoneAudio": True,
        },
    )
    assert response.status_code == 201
    return response.json()["captureSession"]


def _register_chunk(client: TestClient, meeting_id: str, client_chunk_id: str, sequence: int = 1):
    return client.post(
        f"/api/meetings/{meeting_id}/capture-sessions/chunk",
        json={
            "clientChunkId": client_chunk_id,
            "sequence": sequence,
            "durationMs": 4000,
            "byteSize": 64000,
            "mimeType": "video/webm",
        },
    )


def _process_chunk(client: TestClient, meeting_id: str, client_chunk_id: str) -> None:
    upload_response = client.post(
        f"/api/meetings/{meeting_id}/capture-sessions/chunk/upload-complete",
        json={"clientChunkId": client_chunk_id},
    )
    assert upload_response.status_code == 200


def test_capture_chunk_registration_is_idempotent_and_sequence_safe(client: TestClient):
    meeting_id = _create_live_browser_meeting(client)
    _start_capture_session(client, meeting_id)

    first_response = _register_chunk(client, meeting_id, "client-chunk-0001", sequence=1)
    assert first_response.status_code == 200
    first_payload = first_response.json()
    assert first_payload["chunk"]["uploadStatus"] == "ready"
    assert first_payload["meeting"]["metrics"]["captureChunksCount"] == 1

    duplicate_response = _register_chunk(client, meeting_id, "client-chunk-0001", sequence=1)
    assert duplicate_response.status_code == 200
    duplicate_payload = duplicate_response.json()
    assert duplicate_payload["chunk"]["id"] == first_payload["chunk"]["id"]
    assert duplicate_payload["meeting"]["metrics"]["captureChunksCount"] == 1

    conflict_response = _register_chunk(client, meeting_id, "client-chunk-0002", sequence=1)
    assert conflict_response.status_code == 409
    assert "Chunk sequence already exists" in conflict_response.text


def test_processed_chunk_exposes_context_insight_and_memory_surfaces(client: TestClient):
    meeting_id = _create_live_browser_meeting(client)
    _start_capture_session(client, meeting_id)
    register_response = _register_chunk(client, meeting_id, "client-chunk-1001", sequence=1)
    assert register_response.status_code == 200

    _process_chunk(client, meeting_id, "client-chunk-1001")

    context_response = client.get(
        f"/api/meetings/{meeting_id}/capture-sessions/chunks/client-chunk-1001/context"
    )
    assert context_response.status_code == 200
    context_payload = context_response.json()
    assert len(context_payload["chunkContext"]["transcriptSegments"]) == 2
    assert len(context_payload["chunkContext"]["screenEvents"]) >= 1
    assert context_payload["meetingState"]["latestChunkClientId"] == "client-chunk-1001"

    insight_response = client.get(f"/api/meetings/{meeting_id}/insights/chunks/client-chunk-1001")
    assert insight_response.status_code == 200
    insight_payload = insight_response.json()["insight"]
    assert insight_payload["clientChunkId"] == "client-chunk-1001"
    assert len(insight_payload["focusAreas"]) >= 2
    assert len(insight_payload["memoryQueries"]) >= 1
    assert context_payload["meetingState"]["openDecisions"][0]["evidence"][0]["clientChunkId"] == "client-chunk-1001"

    memory_response = client.post(
        f"/api/meetings/{meeting_id}/memory/search-prior-outcomes",
        json={
            "recordType": "blocker",
            "summary": "Authentication release blocker is still active",
            "detail": "The auth configuration drift is blocking the release and needs a historical comparison.",
        },
    )
    assert memory_response.status_code == 200
    matches = memory_response.json()["matches"]
    assert len(matches) >= 1
    assert matches[0]["sourceMeetingId"] == "mtg_hist_auth_01"


def test_summary_packet_output_registration_and_final_report_flow(client: TestClient):
    meeting_id = _create_live_browser_meeting(client)
    _start_capture_session(client, meeting_id)
    register_response = _register_chunk(client, meeting_id, "client-chunk-2001", sequence=1)
    assert register_response.status_code == 200
    _process_chunk(client, meeting_id, "client-chunk-2001")

    outputs_response = client.post(
        f"/api/meetings/{meeting_id}/outputs/register",
        json={
            "clientChunkId": "client-chunk-2001",
            "decisions": [
                {
                    "title": "Publish the rollback plan before the next deploy",
                    "rationale": "The team wants a durable handoff artifact before resuming release work.",
                    "speakerLabel": "Jordan",
                }
            ],
            "commitments": [
                {
                    "ownerLabel": "Mina",
                    "action": "Attach the rollout verification checklist to the ticket",
                    "dueHint": "Today",
                }
            ],
            "blockers": [],
            "openQuestions": [
                {
                    "question": "Who signs off on rollback readiness once staging is green?",
                    "speakerLabel": "Avery",
                }
            ],
            "memoryMatches": [
                {
                    "sourceMeetingId": "mtg_hist_auth_01",
                    "summary": "Rollback readiness was also a concern in the prior release review.",
                    "sourceMeetingTitle": "Sprint 21 release review",
                    "strength": "related",
                    "relation": "recurring",
                    "score": 0.77,
                    "snippet": "Rollback readiness had to be confirmed before the release freeze was lifted.",
                }
            ],
        },
    )
    assert outputs_response.status_code == 200
    state_after_outputs = outputs_response.json()["meetingState"]
    assert len(state_after_outputs["openQuestions"]) >= 1

    summary_response = client.get(f"/api/meetings/{meeting_id}/summary-packet")
    assert summary_response.status_code == 200
    summary_packet = summary_response.json()["summaryPacket"]
    assert summary_packet["meetingStatus"] == "live"
    assert len(summary_packet["reportChecklist"]) >= 4
    assert len(summary_packet["timelineHighlights"]) >= 1
    assert len(summary_packet["decisions"]) >= 2
    assert len(summary_packet["decisions"][0]["evidence"]) >= 1
    assert summary_packet["decisions"][0]["evidence"][0]["clientChunkId"] == "client-chunk-2001"

    end_response = client.post(f"/api/meetings/{meeting_id}/end")
    assert end_response.status_code == 200

    finalize_response = client.post(f"/api/meetings/{meeting_id}/final-report")
    assert finalize_response.status_code == 200
    final_report = finalize_response.json()["report"]
    assert final_report["meetingId"] == meeting_id
    assert len(final_report["decisions"]) >= 2
    assert len(final_report["openQuestions"]) >= 1
    assert len(final_report["decisions"][0]["evidence"]) >= 1
    assert final_report["decisions"][0]["evidence"][0]["transcriptRef"] is not None

    ended_summary_response = client.get(f"/api/meetings/{meeting_id}/summary-packet")
    assert ended_summary_response.status_code == 200
    assert ended_summary_response.json()["summaryPacket"]["meetingStatus"] == "ended"
