"""Memory-retrieval tool stubs for VisualSprint ADK agents."""

from __future__ import annotations

from typing import Any


def search_prior_outcomes(
    recordType: str,
    summary: str,
    detail: str = "",
    tenantId: str = "default",
    meetingId: str = "",
) -> dict[str, Any]:
    """Return ranked historical outcome candidates for the current signal.

    This tool is intentionally a scaffold in the `thanoban` branch. The production
    Elastic MCP implementation is owned by a separate teammate and should replace
    this placeholder during cloud deployment wiring.
    """

    return {
        "status": "not_configured",
        "recordType": recordType,
        "summary": summary,
        "detail": detail,
        "tenantId": tenantId,
        "meetingId": meetingId,
        "matches": [],
        "note": (
            "Elastic MCP retrieval is not wired in this branch yet. Treat the current "
            "response as an empty memory result."
        ),
    }
