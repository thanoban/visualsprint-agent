"use client";

import { MeetingSessionProvider } from "../meeting-session/context/meeting-session-provider";
import type { WorkspaceView } from "../meeting-session/types";
import { ActionsPage } from "../actions/actions-page";
import { DevPanelsPage } from "../dev/dev-panels-page";
import { LiveSessionPage } from "../live/live-session-page";
import { MeetingReportPage } from "../report/meeting-report-page";
import { MeetingSetupPage } from "../setup/meeting-setup-page";

export type { WorkspaceView };

export function MeetingWorkspace({
  meetingId,
  view = "setup",
}: {
  meetingId?: string;
  view?: WorkspaceView;
}) {
  return (
    <MeetingSessionProvider loadDevMeta={view === "dev"} meetingId={meetingId}>
      {view === "setup" ? <MeetingSetupPage /> : null}
      {view === "live" ? <LiveSessionPage /> : null}
      {view === "report" ? <MeetingReportPage /> : null}
      {view === "actions" ? <ActionsPage /> : null}
      {view === "dev" ? <DevPanelsPage /> : null}
    </MeetingSessionProvider>
  );
}
