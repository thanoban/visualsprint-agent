import type { CaptureChunkSummary, CaptureSessionSummary } from "@visualsprint/contracts";
import { Layers, CheckCircle2, Clock, AlertCircle } from "lucide-react";

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
    <article className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:border-border-strong hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
              <Layers size={14} strokeWidth={2} className="text-brand" />
            </div>
            <p className="text-sm font-semibold text-foreground">Segment {chunk.sequence}</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            {formatBytes(chunk.byteSize)} recorded over {formatDuration(chunk.durationMs)}.
          </p>
          <p className="mt-2 text-xs text-foreground-subtle">
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
          <span className="rounded-lg bg-surface-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted">
            {chunk.lifecycleStatus}
          </span>
          <span className="rounded-lg bg-surface-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted">
            processing {chunk.processingStatus}
          </span>
          <span className="text-xs text-foreground-subtle">{formatTimestamp(chunk.recordedAt)}</span>
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
      <div className="flex items-center gap-2 rounded-lg bg-surface-muted p-3 text-sm text-foreground-muted">
        <AlertCircle size={14} strokeWidth={2} className="text-[var(--status-draft)]" />
        Start the meeting, then begin capture to stream audio and screen context.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm leading-6 text-foreground-muted">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} strokeWidth={2} className="text-[var(--status-live)]" />
        <p>
          Recording with {formatRecorderMimeType(recorderMimeType ?? "browser-default")} ({status}).
        </p>
      </div>
      {session ? (
        <div className="flex items-center gap-2">
          <Clock size={14} strokeWidth={2} className="text-foreground-muted" />
          <p>
            Active share: {formatCaptureTracks(session)} · {session.chunkCount} segments uploaded
          </p>
        </div>
      ) : null}
    </div>
  );
}
