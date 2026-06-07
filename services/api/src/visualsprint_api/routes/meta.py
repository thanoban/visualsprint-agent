"""Metadata routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter

from visualsprint_api.config import settings
from visualsprint_api.models import ElasticIntegrationStatus, PlatformMetaResponse
from visualsprint_api.service_status import get_downstream_service_statuses

router = APIRouter(tags=["meta"])


@router.get("/meta", response_model=PlatformMetaResponse)
def get_meta() -> PlatformMetaResponse:
    return PlatformMetaResponse(
        service=settings.service_name,
        environment=settings.environment,
        selectedTrack=settings.selected_track,
        supportedTracks=list(settings.supported_tracks),
        architecture={
            "frontend": "nextjs",
            "backend": "fastapi",
            "agentOrchestration": "google-agent-builder",
            "memoryLayer": "elastic",
        },
        modules=[
            "control-plane",
            "capture-lifecycle",
            "agent-runtime-integration",
            "shared-contracts",
        ],
        memoryIntegration=ElasticIntegrationStatus(
            writebackConfigured=settings.elastic_writeback_configured,
            elasticsearchUrlConfigured=settings.elasticsearch_url_configured,
            apiKeySecretConfigured=settings.elasticsearch_api_key_configured,
            mcpServerConfigured=settings.elastic_mcp_server_configured,
            outcomesIndex=settings.elastic_index_outcomes,
            note=settings.elastic_integration_note,
        ),
        downstreamServices=get_downstream_service_statuses(),
    )
