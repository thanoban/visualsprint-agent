"""Lightweight Elastic MCP client for the VisualSprint agents service."""

from __future__ import annotations

import json
from typing import Any
from urllib import error, request

from visualsprint_agents.config import settings


def call_search_prior_outcomes_tool(
    *,
    record_type: str,
    summary: str,
    detail: str,
    tenant_id: str = "default",
    meeting_id: str = "",
) -> dict[str, Any]:
    if not settings.elastic_mcp_endpoint:
        return _not_configured(
            record_type=record_type,
            summary=summary,
            detail=detail,
            tenant_id=tenant_id,
            meeting_id=meeting_id,
            note="Elastic MCP endpoint is not configured for this agents service runtime.",
        )
    if not settings.elastic_api_key:
        return _not_configured(
            record_type=record_type,
            summary=summary,
            detail=detail,
            tenant_id=tenant_id,
            meeting_id=meeting_id,
            note=(
                "Elastic MCP endpoint is configured, but a runtime API key value is not present. "
                "Set VISUALSPRINT_ELASTIC_API_KEY for direct MCP calls in this environment."
            ),
        )

    initialize_response = _mcp_request(
        method="initialize",
        params={
            "capabilities": {},
            "clientInfo": {
                "name": "visualsprint-agents",
                "version": settings.version,
            },
            "protocolVersion": "2024-11-05",
        },
        request_id=1,
    )
    if initialize_response is None:
        return _unavailable(
            record_type=record_type,
            summary=summary,
            detail=detail,
            tenant_id=tenant_id,
            meeting_id=meeting_id,
            note="Elastic MCP initialize request failed; no historical matches were returned.",
        )

    tool_response = _mcp_request(
        method="tools/call",
        params={
            "name": "search_prior_outcomes",
            "arguments": {
                "recordType": record_type,
                "summary": summary,
                "detail": detail,
                "tenantId": tenant_id,
                "meetingId": meeting_id,
            },
        },
        request_id=2,
    )
    if tool_response is None:
        return _unavailable(
            record_type=record_type,
            summary=summary,
            detail=detail,
            tenant_id=tenant_id,
            meeting_id=meeting_id,
            note="Elastic MCP tool invocation failed; no historical matches were returned.",
        )

    parsed = _extract_tool_matches(tool_response)
    if parsed is None:
        return _unavailable(
            record_type=record_type,
            summary=summary,
            detail=detail,
            tenant_id=tenant_id,
            meeting_id=meeting_id,
            note="Elastic MCP returned an unexpected tool payload shape.",
        )

    matches = parsed.get("matches", [])
    note = parsed.get(
        "note",
        "Elastic MCP search returned ranked historical candidates for the reasoning flow.",
    )
    return {
        "status": "ok",
        "recordType": record_type,
        "summary": summary,
        "detail": detail,
        "tenantId": tenant_id,
        "meetingId": meeting_id,
        "matches": matches if isinstance(matches, list) else [],
        "note": note,
    }


def _mcp_request(*, method: str, params: dict[str, Any], request_id: int) -> dict[str, Any] | None:
    if not settings.elastic_mcp_endpoint or not settings.elastic_api_key:
        return None

    payload = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": params,
    }
    try:
        response = request.urlopen(
            request.Request(
                url=settings.elastic_mcp_endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"ApiKey {settings.elastic_api_key}",
                },
                method="POST",
            ),
            timeout=settings.agent_request_timeout_seconds,
        )
        decoded = json.loads(response.read().decode("utf-8"))
        return decoded if isinstance(decoded, dict) else None
    except (error.URLError, error.HTTPError, json.JSONDecodeError):
        return None


def _extract_tool_matches(response: dict[str, Any]) -> dict[str, Any] | None:
    result = response.get("result")
    if isinstance(result, dict):
        structured = result.get("structuredContent")
        if isinstance(structured, dict):
            return structured
        content = result.get("content")
        if isinstance(content, list):
            for item in content:
                if not isinstance(item, dict):
                    continue
                text = item.get("text")
                if not isinstance(text, str) or not text.strip():
                    continue
                try:
                    parsed = json.loads(text)
                except json.JSONDecodeError:
                    continue
                if isinstance(parsed, dict):
                    return parsed
    return None


def _not_configured(
    *,
    record_type: str,
    summary: str,
    detail: str,
    tenant_id: str,
    meeting_id: str,
    note: str,
) -> dict[str, Any]:
    return {
        "status": "not_configured",
        "recordType": record_type,
        "summary": summary,
        "detail": detail,
        "tenantId": tenant_id,
        "meetingId": meeting_id,
        "matches": [],
        "note": note,
    }


def _unavailable(
    *,
    record_type: str,
    summary: str,
    detail: str,
    tenant_id: str,
    meeting_id: str,
    note: str,
) -> dict[str, Any]:
    return {
        "status": "unavailable",
        "recordType": record_type,
        "summary": summary,
        "detail": detail,
        "tenantId": tenant_id,
        "meetingId": meeting_id,
        "matches": [],
        "note": note,
    }
