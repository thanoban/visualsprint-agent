"""FastAPI entrypoint for the VisualSprint agents service."""

from __future__ import annotations

from fastapi import FastAPI

from visualsprint_agents.config import settings
from visualsprint_agents.models import (
    ChunkInsightRequest,
    FinalReportDraft,
    ReasoningRunResponse,
    ServiceHealth,
    SummaryPacketRequest,
)
from visualsprint_agents.reasoning import run_reasoning_agent
from visualsprint_agents.summary import run_summary_agent


app = FastAPI(
    title="VisualSprint Agents",
    version=settings.version,
    summary="Adapter boundary for chunk reasoning and summary-agent behavior.",
)


@app.get("/api/health", response_model=ServiceHealth)
def get_health() -> ServiceHealth:
    return ServiceHealth(
        service=settings.service_name,
        version=settings.version,
        track=settings.selected_track,
        mode=settings.agent_mode,
        deploymentTarget=settings.deployment_target,
        deploymentReady=settings.deployment_ready,
        reasoningAgentConfigured=settings.reasoning_agent_configured,
        summaryAgentConfigured=settings.summary_agent_configured,
        reasoningEndpointConfigured=settings.reasoning_endpoint_configured,
        summaryEndpointConfigured=settings.summary_endpoint_configured,
        bridgeAuthConfigured=settings.bridge_auth_configured,
        secretManagerConfigured=settings.secret_manager_configured,
        cloudRunServiceConfigured=settings.cloud_run_service_configured,
        elasticMcpConfigured=settings.elastic_mcp_configured,
        allowedOriginsConfigured=len(settings.allowed_origins),
        missingConfiguration=list(settings.missing_cloud_configuration),
        note=settings.health_note,
    )


@app.post("/api/reasoning/chunks/run", response_model=ReasoningRunResponse)
def run_chunk_reasoning(payload: ChunkInsightRequest) -> ReasoningRunResponse:
    return run_reasoning_agent(payload)


@app.post("/api/summary/meetings/run", response_model=FinalReportDraft)
def run_meeting_summary(payload: SummaryPacketRequest) -> FinalReportDraft:
    return run_summary_agent(payload)


@app.get("/")
def get_root() -> dict[str, str]:
    return {
        "name": "VisualSprint Agents",
        "message": settings.health_note,
    }
