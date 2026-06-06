"""Health routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter

from visualsprint_api.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def get_health() -> dict[str, str]:
    return {
        "service": settings.service_name,
        "status": "ok",
        "version": settings.version,
        "track": settings.selected_track,
    }
