from __future__ import annotations

from fastapi.testclient import TestClient

from visualsprint_ingest.main import app


def test_ingest_health_and_transcript_processing():
    with TestClient(app) as client:
        health_response = client.get("/api/health")
        assert health_response.status_code == 200
        assert health_response.json()["service"] == "visualsprint-ingest"

        upload_response = client.post(
            "/api/uploads/chunks/reserve",
            json={
                "meetingId": "mtg_ingest_001",
                "captureSessionId": "cap_ingest_001",
                "clientChunkId": "client-chunk-ingest-001",
                "sequence": 2,
                "mimeType": "video/webm",
            },
        )
        assert upload_response.status_code == 200
        upload_payload = upload_response.json()
        assert upload_payload["clientChunkId"] == "client-chunk-ingest-001"
        assert upload_payload["uploadTarget"]["objectPath"].endswith(
            "client-chunk-ingest-001.webm"
        )

        transcript_response = client.post(
            "/api/transcript/chunks/process",
            json={
                "chunkId": "chk_ingest_001",
                "clientChunkId": "client-chunk-ingest-001",
                "sequence": 2,
                "recordedAt": "2026-06-07T09:00:00Z",
                "durationMs": 5000,
                "mimeType": "video/webm",
            },
        )
        assert transcript_response.status_code == 200
        payload = transcript_response.json()
        assert payload["chunkId"] == "chk_ingest_001"
        assert payload["transcriptSegmentCount"] == 2
        assert len(payload["transcriptSegments"]) == 2
