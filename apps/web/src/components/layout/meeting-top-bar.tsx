"use client";

import type { MeetingDetail } from "@visualsprint/contracts";
import Link from "next/link";

import { useElapsedTime } from "../../hooks/use-elapsed-time";
import type { StreamStatus } from "../../hooks/use-meeting-stream";
import { primaryButtonClassName, secondaryButtonClassName } from "../ui/button-styles";
import { StatusPill } from "../ui/status-pill";

export function MeetingTopBar({
  meeting,
  streamStatus,
  capturePhase,
  isBusy,
  onEndMeeting,
}: {
  meeting: MeetingDetail;
  streamStatus: StreamStatus;
  capturePhase: string;
  isBusy: boolean;
  onEndMeeting: () => void;
}) {
  const elapsed = useElapsedTime(meeting.startedAt, meeting.status === "live");

  const streamLabel =
    streamStatus === "live"
      ? "Live"
      : streamStatus === "connecting"
        ? "Connecting"
        : streamStatus === "reconnecting"
          ? "Reconnecting"
          : "Idle";

  const streamClass =
    streamStatus === "live"
      ? "bg-[var(--status-live)]"
      : streamStatus === "reconnecting"
        ? "bg-[var(--status-draft)]"
        : "bg-foreground-muted";

  return (
    <div className="sticky top-[73px] z-40 -mx-6 border-b border-border bg-[var(--bg-elevated)]/95 px-6 py-4 backdrop-blur sm:-mx-10 sm:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{meeting.title}</h1>
            <StatusPill status={meeting.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
            <span>{meeting.participantCount} participants</span>
            <span className="font-mono text-lg text-foreground">{elapsed}</span>
            <span className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${streamClass}`} />
              SSE {streamLabel}
            </span>
            <span>Capture: {capturePhase}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className={secondaryButtonClassName}
            href={`/meetings/${meeting.id}/report`}
          >
            View report
          </Link>
          <button
            className={primaryButtonClassName}
            disabled={isBusy || meeting.status !== "live"}
            onClick={onEndMeeting}
            type="button"
          >
            {meeting.status === "live" ? "End meeting" : "Meeting ended"}
          </button>
        </div>
      </div>
    </div>
  );
}
