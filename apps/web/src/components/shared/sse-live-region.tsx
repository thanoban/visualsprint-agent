"use client";

import type { StreamStatus } from "../../hooks/use-meeting-stream";

export function SseLiveRegion({
  streamStatus,
  meetingTitle,
}: {
  streamStatus: StreamStatus;
  meetingTitle?: string;
}) {
  const message =
    streamStatus === "live"
      ? `${meetingTitle ?? "Meeting"} live updates connected.`
      : streamStatus === "connecting"
        ? "Connecting to live meeting updates."
        : streamStatus === "reconnecting"
          ? "Reconnecting to live meeting updates."
          : "Live updates idle.";

  return (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
