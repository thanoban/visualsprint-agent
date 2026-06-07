"""Invocation bridge for configured cloud-agent execution."""

from __future__ import annotations

import json
from urllib import error, request

from visualsprint_agents.config import settings
from visualsprint_agents.models import (
    FinalReportDraft,
    ReasoningRunResponse,
    SummaryPacketRequest,
    ChunkInsightRequest,
)


def invoke_reasoning_agent(payload: ChunkInsightRequest) -> ReasoningRunResponse | None:
    """Try the configured reasoning-agent bridge and return validated output."""

    if not settings.cloud_adapter_ready or not settings.reasoning_agent_endpoint_url:
        return None

    response_payload = _post_json(
        url=settings.reasoning_agent_endpoint_url,
        payload=payload.model_dump(mode="json"),
        target_agent_id=settings.reasoning_agent_id,
    )
    if response_payload is None:
        return None
    try:
        return ReasoningRunResponse.model_validate(response_payload)
    except ValueError:
        return None


def invoke_summary_agent(payload: SummaryPacketRequest) -> FinalReportDraft | None:
    """Try the configured summary-agent bridge and return validated output."""

    if not settings.cloud_adapter_ready or not settings.summary_agent_endpoint_url:
        return None

    response_payload = _post_json(
        url=settings.summary_agent_endpoint_url,
        payload=payload.model_dump(mode="json"),
        target_agent_id=settings.summary_agent_id,
    )
    if response_payload is None:
        return None
    try:
        return FinalReportDraft.model_validate(response_payload)
    except ValueError:
        return None


def _post_json(
    *,
    url: str,
    payload: dict,
    target_agent_id: str | None,
) -> dict | None:
    headers = {
        "Content-Type": "application/json",
    }
    if settings.agent_bridge_bearer_token:
        headers["Authorization"] = f"Bearer {settings.agent_bridge_bearer_token}"
    if settings.google_cloud_project_id:
        headers["X-VisualSprint-Gcp-Project"] = settings.google_cloud_project_id
    if settings.google_cloud_location:
        headers["X-VisualSprint-Gcp-Location"] = settings.google_cloud_location
    if settings.agent_application_id:
        headers["X-VisualSprint-Agent-Application"] = settings.agent_application_id
    if target_agent_id:
        headers["X-VisualSprint-Agent-Id"] = target_agent_id

    try:
        response = request.urlopen(
            request.Request(
                url=url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            ),
            timeout=settings.agent_request_timeout_seconds,
        )
        return json.loads(response.read().decode("utf-8"))
    except (error.URLError, error.HTTPError, json.JSONDecodeError):
        return None
