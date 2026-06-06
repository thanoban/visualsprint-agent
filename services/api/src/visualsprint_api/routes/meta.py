"""Metadata routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter

from visualsprint_api.config import settings

router = APIRouter(tags=["meta"])


@router.get("/meta")
def get_meta() -> dict[str, object]:
    return {
        "service": settings.service_name,
        "environment": settings.environment,
        "selectedTrack": settings.selected_track,
        "supportedTracks": list(settings.supported_tracks),
        "architecture": {
            "frontend": "nextjs",
            "backend": "fastapi",
            "agentOrchestration": "google-agent-builder",
            "memoryLayer": "elastic",
        },
        "modules": [
            "control-plane",
            "capture-lifecycle",
            "agent-runtime-integration",
            "shared-contracts",
        ],
    }
