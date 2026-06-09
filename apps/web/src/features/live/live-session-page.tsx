"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MeetingTopBar } from "../../components/layout/meeting-top-bar";
import { SseLiveRegion } from "../../components/shared/sse-live-region";
import { ErrorBanner } from "../../components/shared/error-banner";
import { PageSkeleton } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { CapturePanel } from "./components/capture-panel";
import { LiveMetricsRow } from "./components/live-metrics-row";
import { MemoryPanel } from "./components/memory-panel";
import { ReasoningPanels } from "./components/reasoning-panels";
import { RecordsPanels } from "./components/records-panels";

export function LiveSessionPage() {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState("session");
  const {
    meeting,
    streamStatus,
    capturePhase,
    isBusy,
    error,
    endMeetingSession,
  } = useMeetingSession();

  useEffect(() => {
    if (!meeting) {
      return;
    }
    if (meeting.status === "draft") {
      router.replace(`/meetings/new?meetingId=${meeting.id}`);
      return;
    }
    if (meeting.status === "ended") {
      router.replace(`/meetings/${meeting.id}/report`);
    }
  }, [meeting, router]);

  if (!meeting) {
    return <PageSkeleton />;
  }

  if (meeting.status === "draft" || meeting.status === "ended") {
    return <PageSkeleton />;
  }

  const sessionPanels = (
    <>
      <LiveMetricsRow meeting={meeting} />
      <CapturePanel />
    </>
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 sm:px-10">
      <SseLiveRegion meetingTitle={meeting.title} streamStatus={streamStatus} />

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

      <div className="lg:hidden">
        <Tabs
          activeId={mobileTab}
          items={[
            { id: "session", label: "Session", content: sessionPanels },
            { id: "memory", label: "Memory", content: <MemoryPanel /> },
            { id: "signals", label: "Signals", content: <RecordsPanels /> },
          ]}
          onChange={setMobileTab}
        />
      </div>

      <div className="hidden flex-col gap-6 lg:flex">
        {sessionPanels}
        <ReasoningPanels />
      </div>

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
