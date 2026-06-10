"use client";

import type { MeetingDetail } from "@visualsprint/contracts";
import Link from "next/link";
import { FileText, Square, Radio, Users, Clock } from "lucide-react";

import { useElapsedTime } from "../../hooks/use-elapsed-time";
import type { StreamStatus } from "../../hooks/use-meeting-stream";
import { formatCapturePhase, formatStreamStatus } from "../../lib/format";
import { Button } from "../ui/button";
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

  const streamClass =
    streamStatus === "live"
      ? "bg-[var(--status-live)]"
      : streamStatus === "reconnecting"
        ? "bg-[var(--status-draft)]"
        : "bg-foreground-muted";

  return (
    <div className="sticky top-[57px] z-40 -mx-4 border-b border-border bg-[var(--bg-elevated)]/90 px-4 py-3 backdrop-glass sm:-mx-8 sm:px-8 sm:py-4 lg:-mx-10 lg:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {meeting.title}
            </h1>
            <StatusPill status={meeting.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} strokeWidth={2} />
              {meeting.participantCount} participants
            </span>
            <span className="font-mono text-lg font-medium tabular-nums tracking-tight text-foreground">
              <Clock size={14} strokeWidth={2} className="mr-1 inline-block text-foreground-muted" />
              {elapsed}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${streamClass} ${streamStatus === "live" ? "live-pulse" : ""}`} />
              <Radio size={14} strokeWidth={2} className="sm:hidden" />
              Live updates {formatStreamStatus(streamStatus)}
            </span>
            <span>Capture {formatCapturePhase(capturePhase)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/meetings/${meeting.id}/report`}>
            <Button variant="secondary" size="sm" leftIcon={<FileText size={14} strokeWidth={2} />}>
              View report
            </Button>
          </Link>
          <Button
            variant={meeting.status === "live" ? "danger" : "secondary"}
            size="sm"
            leftIcon={<Square size={14} strokeWidth={2} />}
            disabled={isBusy || meeting.status !== "live"}
            onClick={onEndMeeting}
          >
            {meeting.status === "live" ? "End meeting" : "Meeting ended"}
          </Button>
        </div>
      </div>
    </div>
  );
}
