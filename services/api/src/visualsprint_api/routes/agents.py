"""Agent-adapter inspection routes for the VisualSprint API."""

from __future__ import annotations

from fastapi import APIRouter

from visualsprint_api.models import AgentInvocationAuditResponse
from visualsprint_api.service_clients import get_agents_invocation_audit

router = APIRouter(tags=["agents"])


@router.get("/meta/agents/invocations", response_model=AgentInvocationAuditResponse)
def get_agent_invocation_audit() -> AgentInvocationAuditResponse:
    return get_agents_invocation_audit()
