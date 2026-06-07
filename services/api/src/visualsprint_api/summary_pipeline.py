"""Deterministic summary-packet assembler for the future Summary Agent."""

from __future__ import annotations

from visualsprint_api.models import MeetingDetail, MeetingStateSnapshot, MeetingSummaryPacket, SummaryPacketHighlight


def build_meeting_summary_packet(
    meeting: MeetingDetail,
    meeting_state: MeetingStateSnapshot,
) -> MeetingSummaryPacket:
    """Assemble the end-of-meeting packet the summary agent would consume."""

    timeline_highlights = [
        SummaryPacketHighlight(
            title=event.title,
            detail=event.detail,
            kind=event.kind,
            recordedAt=event.at,
        )
        for event in meeting.latestEvents[:6]
    ]

    checklist = [
        "Summarize the durable decisions, not every conversational turn.",
        "Call out commitments with owners and due hints clearly.",
        "Keep unresolved blockers and open questions visible in the final handoff.",
        "Reference historical memory matches only when they change priority or confidence.",
    ]

    if meeting.recentScreenEvents:
        checklist.append("Use visible screen evidence when it strengthens the report narrative.")
    if meeting.status != "ended":
        checklist.append("Mark the packet as in-progress because the meeting is still open.")

    summary_parts = [
        f"{meeting.title} currently holds {len(meeting.recentDecisions)} decisions,",
        f"{len(meeting.recentCommitments)} commitments, and",
        f"{len(meeting.recentBlockers)} blockers in the structured state.",
    ]
    if meeting.recentOpenQuestions:
        summary_parts.append(
            f"{len(meeting.recentOpenQuestions)} open questions still need explicit follow-up."
        )
    if meeting.recentMemoryMatches:
        summary_parts.append(
            "Historical memory matches are available to help describe recurring patterns."
        )
    if meeting.status != "ended":
        summary_parts.append(
            "The meeting is still live, so this packet is a preview rather than a finalized report input."
        )

    return MeetingSummaryPacket(
        meetingId=meeting.id,
        meetingTitle=meeting.title,
        meetingStatus=meeting.status,
        draftExecutiveSummary=" ".join(summary_parts),
        reportChecklist=checklist[:6],
        timelineHighlights=timeline_highlights,
        meetingState=meeting_state,
        decisions=[decision.model_copy(deep=True) for decision in meeting.recentDecisions],
        commitments=[commitment.model_copy(deep=True) for commitment in meeting.recentCommitments],
        blockers=[blocker.model_copy(deep=True) for blocker in meeting.recentBlockers],
        openQuestions=[question.model_copy(deep=True) for question in meeting.recentOpenQuestions],
        memoryHighlights=[match.model_copy(deep=True) for match in meeting.recentMemoryMatches],
        transcriptEvidence=[segment.model_copy(deep=True) for segment in meeting.recentTranscriptSegments],
        visualEvidence=[screen.model_copy(deep=True) for screen in meeting.recentScreenEvents],
    )
