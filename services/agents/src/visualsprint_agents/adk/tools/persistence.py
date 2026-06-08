"""Persistence tools for VisualSprint ADK agents.

These let a deployed ADK agent write its results back through the deterministic
control plane:

- ``register_outputs`` -> ``POST /api/meetings/{meetingId}/outputs/register``
- ``finalize_report``  -> ``POST /api/meetings/{meetingId}/final-report``

When ``VISUALSPRINT_CONTROL_PLANE_URL`` is not configured, both tools stay in a
safe ``deferred`` no-op mode (so local runs and tests do not require a backend).
The HTTP call uses the stdlib ``urllib`` to avoid extra dependencies.
"""

from __future__ import annotations

import json
from typing import Any
from urllib import error, request

from visualsprint_agents.config import settings


def _post_control_plane(path: str, payload: dict[str, Any] | None) -> tuple[bool, str]:
    base_url = settings.control_plane_url
    if not base_url:
        return False, "control plane URL is not configured"

    url = f"{base_url.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"}
    if settings.control_plane_bearer_token:
        headers["Authorization"] = f"Bearer {settings.control_plane_bearer_token}"

    data = json.dumps(payload if payload is not None else {}).encode("utf-8")
    try:
        response = request.urlopen(
            request.Request(url=url, data=data, headers=headers, method="POST"),
            timeout=settings.agent_request_timeout_seconds,
        )
        return 200 <= response.status < 300, f"control plane responded with {response.status}"
    except error.HTTPError as exc:
        return False, f"control plane returned HTTP {exc.code}"
    except (error.URLError, TimeoutError) as exc:
        return False, f"control plane request failed: {exc}"


def register_outputs(
    meetingId: str,
    clientChunkId: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Persist structured reasoning outputs through the deterministic control plane.

    The agent should assemble a schema-valid ``RegisterAgentOutputsRequest``-style
    payload before calling this.
    """

    if settings.control_plane_configured:
        body = dict(payload)
        body.setdefault("clientChunkId", clientChunkId)
        ok, detail = _post_control_plane(
            f"/api/meetings/{meetingId}/outputs/register",
            body,
        )
        return {
            "status": "ok" if ok else "error",
            "meetingId": meetingId,
            "clientChunkId": clientChunkId,
            "acceptedKeys": sorted(payload.keys()),
            "note": (
                "Outputs were registered through the control plane."
                if ok
                else f"Control plane persistence failed ({detail}); outputs were not written."
            ),
        }

    return {
        "status": "deferred",
        "meetingId": meetingId,
        "clientChunkId": clientChunkId,
        "acceptedKeys": sorted(payload.keys()),
        "note": (
            "VISUALSPRINT_CONTROL_PLANE_URL is not set, so this tool confirmed the "
            "expected persistence shape without writing. Set it to enable real writes."
        ),
    }


def finalize_report(
    meetingId: str,
    report: dict[str, Any],
) -> dict[str, Any]:
    """Persist a final report through the deterministic control plane.

    The control plane's final-report endpoint synthesizes the report from stored
    state and takes no body, so ``report`` is used only for the deferred shape.
    """

    if settings.control_plane_configured:
        ok, detail = _post_control_plane(
            f"/api/meetings/{meetingId}/final-report",
            None,
        )
        return {
            "status": "ok" if ok else "error",
            "meetingId": meetingId,
            "acceptedKeys": sorted(report.keys()),
            "note": (
                "The final report was finalized through the control plane."
                if ok
                else f"Control plane finalize failed ({detail}); no report was written."
            ),
        }

    return {
        "status": "deferred",
        "meetingId": meetingId,
        "acceptedKeys": sorted(report.keys()),
        "note": (
            "VISUALSPRINT_CONTROL_PLANE_URL is not set, so this tool mirrored the "
            "final-report contract without writing. Set it to enable real writes."
        ),
    }
