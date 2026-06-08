"""Persistence tool stubs for VisualSprint ADK agents."""

from __future__ import annotations

from typing import Any


def register_outputs(
    meetingId: str,
    clientChunkId: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Persist structured reasoning outputs through the deterministic control plane.

    The ADK agent should call this only after it has assembled a schema-valid
    `RegisterAgentOutputsRequest` style payload. The concrete API call still lives
    outside the ADK agent and should be supplied during deployment integration.
    """

    return {
        "status": "deferred",
        "meetingId": meetingId,
        "clientChunkId": clientChunkId,
        "acceptedKeys": sorted(payload.keys()),
        "note": (
            "This placeholder tool confirms the expected persistence shape, but the "
            "actual API call must be wired by the deployment adapter."
        ),
    }


def finalize_report(
    meetingId: str,
    report: dict[str, Any],
) -> dict[str, Any]:
    """Persist a final report through the deterministic control plane.

    The summary ADK agent should emit a schema-valid `FinalReport`-style payload
    before this tool is invoked.
    """

    return {
        "status": "deferred",
        "meetingId": meetingId,
        "acceptedKeys": sorted(report.keys()),
        "note": (
            "This placeholder tool mirrors the final-report contract, but production "
            "deployment still needs the real API wiring."
        ),
    }
