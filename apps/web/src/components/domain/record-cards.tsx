import type {
  BlockerRecord,
  CaptureChunkSummary,
  CommitmentRecord,
  DecisionRecord,
  EvidenceReference,
  FinalReport,
  MemoryMatch,
  OpenQuestionRecord,
  ScreenEvent,
  TranscriptSegment,
} from "@visualsprint/contracts";
import {
  GitCommitHorizontal,
  CheckCircle2,
  OctagonAlert,
  HelpCircle,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

import {
  formatFrameTimestamp,
  formatProcessingSourceMode,
  formatScreenEventKind,
  formatTimestamp,
} from "../../lib/format";
import { RecordStatusBadge } from "../ui/status-pill";
import { EvidenceList } from "./evidence-list";

export function SourceModeBadge({
  label,
  mode,
}: {
  label: string;
  mode: CaptureChunkSummary["transcriptSource"] | FinalReport["summarySource"];
}) {
  const className =
    mode === "downstream_service"
      ? "bg-[var(--status-processing)]/15 text-[var(--status-processing)]"
      : "bg-surface-muted text-foreground-muted";

  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] ${className}`}>
      {label} {formatProcessingSourceMode(mode)}
    </span>
  );
}

export function DecisionCard({
  decision,
  onEvidenceSelect,
}: {
  decision: DecisionRecord;
  onEvidenceSelect?: (reference: EvidenceReference) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted p-4 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <GitCommitHorizontal size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-sm font-semibold text-foreground">{decision.title}</p>
        </div>
        <RecordStatusBadge status={decision.status} />
      </div>
      <p className="mt-2 pl-6 text-sm leading-6 text-foreground-muted">{decision.rationale}</p>
      <div className="pl-6">
        <EvidenceList evidence={decision.evidence} onSelect={onEvidenceSelect} />
      </div>
      <p className="mt-3 pl-6 text-xs uppercase tracking-[0.16em] text-foreground-muted">
        {decision.speakerLabel} · {decision.firstSeenChunkId} {"->"} {decision.lastUpdatedChunkId}
      </p>
      <p className="mt-2 pl-6 text-xs text-foreground-muted">{formatTimestamp(decision.recordedAt)}</p>
    </article>
  );
}

export function CommitmentCard({
  commitment,
  onEvidenceSelect,
}: {
  commitment: CommitmentRecord;
  onEvidenceSelect?: (reference: EvidenceReference) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted p-4 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p className="text-sm font-semibold text-foreground">{commitment.ownerLabel}</p>
        </div>
        <RecordStatusBadge status={commitment.status} />
      </div>
      <p className="mt-2 pl-6 text-sm leading-6 text-foreground-muted">{commitment.action}</p>
      <div className="pl-6">
        <EvidenceList evidence={commitment.evidence} onSelect={onEvidenceSelect} />
      </div>
      <p className="mt-3 pl-6 text-xs uppercase tracking-[0.16em] text-foreground-muted">
        Due {commitment.dueHint} · {commitment.firstSeenChunkId} {"->"} {commitment.lastUpdatedChunkId}
      </p>
      <p className="mt-2 pl-6 text-xs text-foreground-muted">{formatTimestamp(commitment.recordedAt)}</p>
    </article>
  );
}

export function BlockerCard({
  blocker,
  onEvidenceSelect,
}: {
  blocker: BlockerRecord;
  onEvidenceSelect?: (reference: EvidenceReference) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted p-4 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <OctagonAlert size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--status-error)]" />
          <p className="text-sm font-semibold text-foreground">{blocker.summary}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-lg bg-[var(--status-draft)]/15 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--status-draft)]">
            {blocker.severity}
          </span>
          <RecordStatusBadge status={blocker.status} />
        </div>
      </div>
      <div className="pl-6">
        <EvidenceList evidence={blocker.evidence} onSelect={onEvidenceSelect} />
      </div>
      <p className="mt-3 pl-6 text-xs uppercase tracking-[0.16em] text-foreground-muted">
        Owner {blocker.ownerLabel} · {blocker.firstSeenChunkId} {"->"} {blocker.lastUpdatedChunkId}
      </p>
      <p className="mt-2 pl-6 text-xs text-foreground-muted">{formatTimestamp(blocker.recordedAt)}</p>
    </article>
  );
}

export function MemoryMatchCard({ memoryMatch }: { memoryMatch: MemoryMatch }) {
  const isRecurring =
    memoryMatch.relation === "recurring" || memoryMatch.relation === "reopened";

  return (
    <article
      className={`rounded-xl border p-4 transition hover:border-border-strong ${
        isRecurring
          ? "border-[var(--accent-memory)]/30 bg-[var(--accent-memory)]/10"
          : "border-border bg-surface-muted"
      }`}
    >
      <div className="flex items-start gap-2">
        <BrainCircuit size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--accent-memory)]" />
        <p className="text-sm font-semibold text-foreground">{memoryMatch.summary}</p>
      </div>
      <p className="mt-2 pl-6 text-sm leading-6 text-foreground-muted">
        Source meeting: {memoryMatch.sourceMeetingTitle}
      </p>
      <p className="mt-2 pl-6 text-sm leading-6 text-foreground-muted">{memoryMatch.snippet}</p>
      <p className="mt-3 pl-6 text-xs uppercase tracking-[0.16em] text-foreground-muted">
        {memoryMatch.relation} · {memoryMatch.strength} · score {memoryMatch.score.toFixed(2)}
      </p>
      <p className="mt-2 pl-6 text-xs text-foreground-muted">
        {memoryMatch.sourceMeetingId} · {formatTimestamp(memoryMatch.recordedAt)}
      </p>
    </article>
  );
}

export function OpenQuestionCard({
  openQuestion,
  onEvidenceSelect,
}: {
  openQuestion: OpenQuestionRecord;
  onEvidenceSelect?: (reference: EvidenceReference) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted p-4 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <HelpCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--status-processing)]" />
          <p className="text-sm font-semibold text-foreground">{openQuestion.question}</p>
        </div>
        <RecordStatusBadge status={openQuestion.status} />
      </div>
      <div className="pl-6">
        <EvidenceList evidence={openQuestion.evidence} onSelect={onEvidenceSelect} />
      </div>
      <p className="mt-3 pl-6 text-xs uppercase tracking-[0.16em] text-foreground-muted">
        {openQuestion.speakerLabel} · {openQuestion.firstSeenChunkId} {"->"} {openQuestion.lastUpdatedChunkId}
      </p>
      <p className="mt-2 pl-6 text-xs text-foreground-muted">{formatTimestamp(openQuestion.recordedAt)}</p>
    </article>
  );
}

export function TranscriptCard({ segment }: { segment: TranscriptSegment }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{segment.speakerLabel}</p>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{segment.text}</p>
        </div>
        <span className="whitespace-nowrap text-xs text-foreground-muted">
          {formatTimestamp(segment.startedAt)}
        </span>
      </div>
    </article>
  );
}

export function ScreenEventCard({ screenEvent }: { screenEvent: ScreenEvent }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{formatScreenEventKind(screenEvent.kind)}</p>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{screenEvent.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-foreground-muted">
            {formatFrameTimestamp(screenEvent.frameTimestampMs)}
          </p>
          <p className="mt-2 text-xs text-foreground-muted">{formatTimestamp(screenEvent.recordedAt)}</p>
        </div>
      </div>
    </article>
  );
}
