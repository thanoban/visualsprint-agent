import { redirect } from "next/navigation";

import { getMeeting } from "../../../lib/api";
import { meetingRouteForStatus } from "../../../lib/meeting";

export default async function MeetingRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const response = await getMeeting(id);
    redirect(meetingRouteForStatus(response.meeting));
  } catch {
    redirect("/meetings");
  }
}
