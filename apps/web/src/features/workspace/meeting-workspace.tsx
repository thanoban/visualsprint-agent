"use client";

import dynamic from "next/dynamic";

import { MeetingSubNav } from "../../components/layout/meeting-sub-nav";
import { PageSkeleton } from "../../components/ui/skeleton";
import { MeetingSessionProvider } from "../meeting-session/context/meeting-session-provider";
import type { WorkspaceView } from "../meeting-session/types";

const MeetingSetupPage = dynamic(
  () => import("../setup/meeting-setup-page").then((module) => module.MeetingSetupPage),
  { loading: () => <PageSkeleton /> },
);
const LiveSessionPage = dynamic(
  () => import("../live/live-session-page").then((module) => module.LiveSessionPage),
  { loading: () => <PageSkeleton /> },
);
const MeetingReportPage = dynamic(
  () => import("../report/meeting-report-page").then((module) => module.MeetingReportPage),
  { loading: () => <PageSkeleton /> },
);
const ActionsPage = dynamic(
  () => import("../actions/actions-page").then((module) => module.ActionsPage),
  { loading: () => <PageSkeleton /> },
);
const DevPanelsPage = dynamic(
  () => import("../dev/dev-panels-page").then((module) => module.DevPanelsPage),
  { loading: () => <PageSkeleton /> },
);

export type { WorkspaceView };

function WorkspaceViewContent({ view }: { view: WorkspaceView }) {
  if (view === "setup") {
    return <MeetingSetupPage />;
  }
  if (view === "live") {
    return <LiveSessionPage />;
  }
  if (view === "report") {
    return <MeetingReportPage />;
  }
  if (view === "actions") {
    return <ActionsPage />;
  }
  if (view === "dev") {
    return <DevPanelsPage />;
  }
  return null;
}

export function MeetingWorkspace({
  meetingId,
  view = "setup",
}: {
  meetingId?: string;
  view?: WorkspaceView;
}) {
  const showSubNav =
    Boolean(meetingId) && (view === "live" || view === "report" || view === "actions");

  return (
    <MeetingSessionProvider loadDevMeta={view === "dev"} meetingId={meetingId}>
      {showSubNav ? <MeetingSubNav meetingId={meetingId} /> : null}
      <WorkspaceViewContent view={view} />
    </MeetingSessionProvider>
  );
}
