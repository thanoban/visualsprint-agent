import type { Metadata } from "next";

import { getMeeting } from "./api";

export async function meetingMetadata(
  meetingId: string,
  suffix: string,
  description: string,
): Promise<Metadata> {
  try {
    const response = await getMeeting(meetingId);
    return {
      title: `${response.meeting.title} · ${suffix} · VisualSprint`,
      description,
    };
  } catch {
    return {
      title: `${suffix} · VisualSprint`,
      description,
    };
  }
}
