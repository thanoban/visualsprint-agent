"use client";

import { captureStages } from "@visualsprint/contracts";
import type { MeetingDetail } from "@visualsprint/contracts";

function stageState(
  stageId: string,
  meeting: MeetingDetail | null,
  capturePhase: string,
) {
  if (!meeting) {
    return stageId === "meeting" ? "current" : "upcoming";
  }

  if (stageId === "meeting") {
    return meeting.status !== "draft" ? "complete" : "current";
  }

  if (stageId === "capture") {
    if (meeting.status === "draft") {
      return "upcoming";
    }
    if (capturePhase === "recording" || meeting.activeCaptureSession) {
      return "complete";
    }
    return meeting.status === "live" ? "current" : "upcoming";
  }

  if (stageId === "chunking") {
    if (meeting.metrics.captureChunksCount > 0) {
      return "complete";
    }
    return capturePhase === "recording" ? "current" : "upcoming";
  }

  if (stageId === "processing") {
    if (meeting.metrics.decisionsCount > 0 || meeting.metrics.transcriptSegmentsCount > 0) {
      return "complete";
    }
    return meeting.metrics.captureChunksCount > 0 ? "current" : "upcoming";
  }

  return "upcoming";
}

export function CaptureStepper({
  meeting,
  capturePhase,
}: {
  meeting: MeetingDetail | null;
  capturePhase: string;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {captureStages.map((stage) => {
        const state = stageState(stage.id, meeting, capturePhase);
        return (
          <li
            key={stage.id}
            className={`rounded-xl border p-4 ${
              state === "complete"
                ? "border-[var(--status-live)]/30 bg-[var(--status-live)]/10"
                : state === "current"
                  ? "border-brand/40 bg-brand/10"
                  : "border-border bg-surface-muted"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted">
              {state === "complete" ? "Complete" : state === "current" ? "In progress" : "Upcoming"}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{stage.label}</p>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{stage.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
