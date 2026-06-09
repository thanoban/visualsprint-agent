"use client";

import { useRouter } from "next/navigation";

import { MeetingTopBar } from "../../components/layout/meeting-top-bar";
import { ErrorBanner } from "../../components/shared/error-banner";
import { EmptyState } from "../../components/ui/empty-state";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { CapturePanel } from "./components/capture-panel";
import { LiveMetricsRow } from "./components/live-metrics-row";
import { ReasoningPanels } from "./components/reasoning-panels";

export function LiveSessionPage() {
  const router = useRouter();
  const { meeting, streamStatus, capturePhase, isBusy, error, endMeetingSession } =
    useMeetingSession();

  if (!meeting) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <EmptyState title="Loading meeting" body="Fetching live session state…" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 sm:px-10">
      <MeetingTopBar
        capturePhase={capturePhase}
        isBusy={isBusy}
        meeting={meeting}
        onEndMeeting={() => {
          void endMeetingSession().then(() => {
            router.push(`/meetings/${meeting.id}/report`);
          });
        }}
        streamStatus={streamStatus}
      />

      <LiveMetricsRow meeting={meeting} />
      <CapturePanel />
      <ReasoningPanels />

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
