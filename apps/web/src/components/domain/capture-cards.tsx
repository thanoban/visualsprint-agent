import type { CaptureChunkSummary } from "@visualsprint/contracts";

import {
  formatBytes,
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
          <p className="text-sm font-semibold text-foreground">Chunk {chunk.sequence}</p>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            {formatBytes(chunk.byteSize)} captured over {formatDuration(chunk.durationMs)}.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-foreground-muted">
            {chunk.transcriptSegmentCount} transcript segments · {chunk.visualEventCount} visual
            events · {chunk.signalCount} derived signals
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
}: {
  hasSession: boolean;
  recorderMimeType?: string;
  status?: string;
}) {
  return (
    <p className="text-sm leading-6 text-foreground-muted">
      {hasSession
        ? `Recorder ${formatRecorderMimeType(recorderMimeType ?? "browser-default")} is ${status}.`
        : "Start the meeting, then begin browser capture to register a live session and emit chunks."}
    </p>
  );
}
