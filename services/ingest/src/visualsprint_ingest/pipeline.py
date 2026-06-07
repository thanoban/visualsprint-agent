"""Deterministic transcript pipeline for the ingest service."""

from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

from visualsprint_ingest.models import ChunkTranscriptRequest, TranscriptSegment


SPEAKER_ROTATION = ("Avery", "Jordan", "Mina", "Theo", "Samir", "Priya")
TRANSCRIPT_TEMPLATES = (
    (
        "We have a release risk around the authentication flow because the environment config is still drifting.",
        "Let's lock the release path today and record the owner so the blocker does not roll into another sprint.",
    ),
    (
        "The shared screen confirms the deployment pipeline failed on the same migration validation step again.",
        "If we isolate the data fix and rerun staging today, we can unblock the release candidate before tomorrow.",
    ),
    (
        "Support escalations increased after the last rollout, so we need a visible decision on alert ownership.",
        "I want the meeting summary to call out the exact commitment and whether this was promised in earlier meetings.",
    ),
)


def build_transcript_segments(chunk: ChunkTranscriptRequest) -> list[TranscriptSegment]:
    """Build stable mock transcript segments from chunk metadata."""

    template_index = (chunk.sequence - 1) % len(TRANSCRIPT_TEMPLATES)
    first_line, second_line = TRANSCRIPT_TEMPLATES[template_index]
    speaker_one = SPEAKER_ROTATION[(chunk.sequence - 1) % len(SPEAKER_ROTATION)]
    speaker_two = SPEAKER_ROTATION[chunk.sequence % len(SPEAKER_ROTATION)]
    recorded_at = chunk.recordedAt
    first_end = recorded_at + timedelta(milliseconds=max(chunk.durationMs // 2, 250))
    final_end = recorded_at + timedelta(milliseconds=max(chunk.durationMs, 500))

    return [
        TranscriptSegment(
            id=f"trn_{uuid4().hex[:12]}",
            speakerLabel=speaker_one,
            startedAt=recorded_at,
            endedAt=first_end,
            text=first_line,
        ),
        TranscriptSegment(
            id=f"trn_{uuid4().hex[:12]}",
            speakerLabel=speaker_two,
            startedAt=first_end,
            endedAt=final_end,
            text=second_line,
        ),
    ]
