"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MeetingTopBar } from "../../components/layout/meeting-top-bar";
import { ErrorBanner } from "../../components/shared/error-banner";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/ui/button-styles";
import { EmptyState } from "../../components/ui/empty-state";
import { PageSkeleton } from "../../components/ui/skeleton";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { CapturePanel } from "./components/capture-panel";
import { LiveMetricsRow } from "./components/live-metrics-row";
import { ReasoningPanels } from "./components/reasoning-panels";

export function LiveSessionPage() {
  const router = useRouter();
  const {
    meeting,
    streamStatus,
    capturePhase,
    isBusy,
    error,
    endMeetingSession,
    startMeetingSession,
  } = useMeetingSession();

  if (!meeting) {
    return <PageSkeleton />;
  }

  if (meeting.status === "draft") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
        <EmptyState
          title="Meeting not started"
          body="Start the meeting session before entering the live dashboard and beginning capture."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className={primaryButtonClassName}
            disabled={isBusy}
            onClick={() => {
              void startMeetingSession();
            }}
            type="button"
          >
            Start meeting
          </button>
          <Link className={secondaryButtonClassName} href={`/meetings/new?meetingId=${meeting.id}`}>
            Back to setup
          </Link>
        </div>
        {error ? (
          <div className="mt-6">
            <ErrorBanner message={error} />
          </div>
        ) : null}
      </div>
    );
  }

  if (meeting.status === "ended") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
        <EmptyState
          title="Meeting ended"
          body="This session has concluded. Open the evidence-backed report to review outcomes."
        />
        <div className="mt-6">
          <Link className={primaryButtonClassName} href={`/meetings/${meeting.id}/report`}>
            View report
          </Link>
        </div>
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
