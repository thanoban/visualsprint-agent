import type { CaptureChunkSummary, CaptureSessionSummary } from "@visualsprint/contracts";

import {
  formatBytes,
  formatCaptureTracks,
  formatDuration,
  formatRecorderMimeType,
  formatTimestamp,
} from "../../lib/format";
import { SourceModeBadge } from "./record-cards";

export function CaptureChunkCard({ chunk }: { chunk: CaptureChunkSummary }) {
  return (
    <article className="rounded-[1.2rem] border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Segment {chunk.sequence}</p>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            {formatBytes(chunk.byteSize)} recorded over {formatDuration(chunk.durationMs)}.
          </p>
          <p className="mt-2 text-xs text-foreground-muted">
            {chunk.transcriptSegmentCount} transcript lines · {chunk.visualEventCount} screen
            moments · {chunk.signalCount} signals extracted
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SourceModeBadge label="transcript" mode={chunk.transcriptSource} />
            <SourceModeBadge label="media" mode={chunk.mediaSource} />
            <SourceModeBadge label="reasoning" mode={chunk.reasoningSource} />
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-foreground-muted">
            {chunk.lifecycleStatus}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-foreground-muted">
            processing {chunk.processingStatus}
          </span>
          <span className="text-xs text-foreground-muted">{formatTimestamp(chunk.recordedAt)}</span>
        </div>
      </div>
    </article>
  );
}

export function CaptureSessionSummary({
  hasSession,
  recorderMimeType,
  status,
  session,
}: {
  hasSession: boolean;
  recorderMimeType?: string;
  status?: string;
  session?: CaptureSessionSummary | null;
}) {
  if (!hasSession) {
    return (
      <p className="text-sm leading-6 text-foreground-muted">
        Start the meeting, then begin capture to stream audio and screen context.
      </p>
    );
  }

  return (
    <div className="space-y-1 text-sm leading-6 text-foreground-muted">
      <p>
        Recording with {formatRecorderMimeType(recorderMimeType ?? "browser-default")} ({status}).
      </p>
      {session ? (
        <p>
          Active share: {formatCaptureTracks(session)} · {session.chunkCount} segments uploaded
        </p>
      ) : null}
    </div>
  );
}
