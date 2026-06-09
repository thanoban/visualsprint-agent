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
      ? `${meetingTitle ?? "Meeting"} live stream connected.`
      : streamStatus === "connecting"
        ? "Connecting to live meeting stream."
        : streamStatus === "reconnecting"
          ? "Reconnecting to live meeting stream."
          : "Live stream idle.";

  return (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
