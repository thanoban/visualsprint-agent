from __future__ import annotations

from fastapi.testclient import TestClient

from visualsprint_media.main import app


def test_media_health_and_visual_processing():
    with TestClient(app) as client:
        health_response = client.get("/api/health")
        assert health_response.status_code == 200
        assert health_response.json()["service"] == "visualsprint-media"

        media_response = client.post(
            "/api/media/chunks/process",
            json={
                "chunkId": "chk_media_001",
                "clientChunkId": "client-chunk-media-001",
                "sequence": 3,
                "recordedAt": "2026-06-07T09:05:00Z",
                "durationMs": 4500,
                "mimeType": "video/webm",
            },
        )
        assert media_response.status_code == 200
        payload = media_response.json()
        assert payload["chunkId"] == "chk_media_001"
        assert payload["frameCount"] >= 3
        assert payload["visualEventCount"] == len(payload["screenEvents"])
