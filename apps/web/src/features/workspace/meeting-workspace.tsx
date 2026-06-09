"use client";

import { MeetingDashboard } from "../../components/meeting-dashboard";

export type WorkspaceView = "live" | "report" | "actions" | "dev" | "full";

export function MeetingWorkspace({
  meetingId,
  view = "full",
}: {
  meetingId?: string;
  view?: WorkspaceView;
}) {
  return <MeetingDashboard meetingId={meetingId} view={view} />;
}
