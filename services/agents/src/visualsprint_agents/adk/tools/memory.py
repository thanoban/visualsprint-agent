"""Memory-retrieval tool stubs for VisualSprint ADK agents."""

from __future__ import annotations

from typing import Any

from visualsprint_agents.elastic_mcp_client import call_search_prior_outcomes_tool


def search_prior_outcomes(
    recordType: str,
    summary: str,
    detail: str = "",
    tenantId: str = "default",
    meetingId: str = "",
) -> dict[str, Any]:
    """Return ranked historical outcome candidates for the current signal.

    When Elastic MCP runtime configuration is available, this tool calls the
    configured Elastic Agent Builder MCP endpoint using the standard MCP JSON-RPC
    flow. If the endpoint or runtime API key is missing, it degrades safely to
    the existing non-configured placeholder response.
    """
    return call_search_prior_outcomes_tool(
        record_type=recordType,
        summary=summary,
        detail=detail,
        tenant_id=tenantId,
        meeting_id=meetingId,
    )
