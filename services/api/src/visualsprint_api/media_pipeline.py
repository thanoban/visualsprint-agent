"""Deterministic frame extraction and visual evidence pipeline for development."""

from __future__ import annotations

from uuid import uuid4

from visualsprint_api.models import CaptureChunkSummary, ScreenEvent


SCREEN_EVENT_TEMPLATES = (
    (
        ("code_editor", "Auth configuration values are open in the editor."),
        ("error", "A release checklist warning is visible beside the auth workflow."),
    ),
    (
        ("terminal", "The terminal shows a migration validation failure in staging."),
        ("ui_state", "Deployment controls are paused while the team inspects logs."),
    ),
    (
        ("diagram", "A handoff diagram is visible for alert routing ownership."),
        ("slide", "A planning slide highlights follow-up owners for the sprint."),
    ),
)


def build_screen_events(chunk: CaptureChunkSummary) -> tuple[int, list[ScreenEvent]]:
    """Build deterministic visual evidence records from chunk metadata."""

    template_index = (chunk.sequence - 1) % len(SCREEN_EVENT_TEMPLATES)
    template = SCREEN_EVENT_TEMPLATES[template_index]
    frame_count = 3 + (chunk.sequence % 3)
    events: list[ScreenEvent] = []

    for index, (kind, summary) in enumerate(template, start=1):
        events.append(
            ScreenEvent(
                id=f"scr_{uuid4().hex[:12]}",
                kind=kind,
                summary=summary,
                frameTimestampMs=min(
                    chunk.durationMs,
                    index * max(chunk.durationMs // (len(template) + 1), 250),
                ),
                recordedAt=chunk.recordedAt,
            )
        )

    return frame_count, events
