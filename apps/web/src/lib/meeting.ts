import type { MeetingDetail, MeetingSummary } from "@visualsprint/contracts";

export function toMeetingSummary(meeting: MeetingDetail): MeetingSummary {
  return {
    id: meeting.id,
    title: meeting.title,
    participantCount: meeting.participantCount,
    status: meeting.status,
    sourceConnector: meeting.sourceConnector,
    primaryTrack: meeting.primaryTrack,
    createdAt: meeting.createdAt,
    startedAt: meeting.startedAt,
    endedAt: meeting.endedAt,
    notes: meeting.notes,
    metrics: meeting.metrics,
  };
}

export function upsertMeetingSummary(
  meetings: MeetingSummary[],
  candidate: MeetingSummary,
) {
  const next = meetings.filter((meeting) => meeting.id !== candidate.id);
  next.unshift(candidate);
  return next;
}

export function meetingRouteForStatus(meeting: Pick<MeetingDetail, "id" | "status">) {
  if (meeting.status === "live") {
    return `/meetings/${meeting.id}/live`;
  }
  if (meeting.status === "ended") {
    return `/meetings/${meeting.id}/report`;
  }
  return `/meetings/new?meetingId=${meeting.id}`;
}
