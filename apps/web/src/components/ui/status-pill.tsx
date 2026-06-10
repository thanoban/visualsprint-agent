import type {
  CaptureSessionSummary,
  DecisionRecord,
  MeetingDetail,
} from "@visualsprint/contracts";
import { Radio, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export type CapturePhase = "idle" | "requesting" | "recording" | "stopping";

const statusIconMap: Record<string, React.ReactNode> = {
  live: <Radio size={12} strokeWidth={2.5} className="live-pulse" />,
  ended: <CheckCircle2 size={12} strokeWidth={2.5} />,
  draft: <Clock size={12} strokeWidth={2.5} />,
};

export function StatusPill({ status }: { status: MeetingDetail["status"] }) {
  const variant =
    status === "live"
      ? "border-[var(--status-live)]/30 bg-[var(--status-live)]/15 text-[var(--status-live)]"
      : status === "ended"
        ? "border-border bg-surface-muted text-foreground-muted"
        : "border-[var(--status-draft)]/30 bg-[var(--status-draft)]/15 text-[var(--status-draft)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${variant}`}
    >
      {statusIconMap[status] ?? null}
      {status}
    </span>
  );
}

export function CaptureStatusPill({
  status,
  phase,
}: {
  status: CaptureSessionSummary["status"] | "idle";
  phase: CapturePhase;
}) {
  const label =
    phase === "requesting"
      ? "requesting"
      : phase === "stopping"
        ? "stopping"
        : status;

  const variant =
    label === "recording"
      ? "border-[var(--status-live)]/30 bg-[var(--status-live)]/15 text-[var(--status-live)]"
      : label === "completed"
        ? "border-border bg-surface-muted text-foreground-muted"
        : label === "requesting" || label === "stopping"
          ? "border-[var(--status-processing)]/30 bg-[var(--status-processing)]/15 text-[var(--status-processing)]"
          : "border-[var(--status-draft)]/30 bg-[var(--status-draft)]/15 text-[var(--status-draft)]";

  const icon =
    label === "recording" ? (
      <Radio size={12} strokeWidth={2.5} className="live-pulse" />
    ) : label === "completed" ? (
      <CheckCircle2 size={12} strokeWidth={2.5} />
    ) : (
      <Clock size={12} strokeWidth={2.5} />
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${variant}`}
    >
      {icon}
      {label}
    </span>
  );
}

export function RecordStatusBadge({
  status,
}: {
  status: DecisionRecord["status"];
}) {
  const className =
    status === "open"
      ? "bg-[var(--status-live)]/15 text-[var(--status-live)]"
      : status === "updated"
        ? "bg-[var(--status-processing)]/15 text-[var(--status-processing)]"
        : status === "reopened"
          ? "bg-[var(--status-draft)]/15 text-[var(--status-draft)]"
          : "bg-surface-muted text-foreground-muted";

  const icon =
    status === "open" ? (
      <Radio size={10} strokeWidth={2.5} className="live-pulse" />
    ) : status === "updated" ? (
      <Clock size={10} strokeWidth={2.5} />
    ) : status === "reopened" ? (
      <AlertCircle size={10} strokeWidth={2.5} />
    ) : (
      <CheckCircle2 size={10} strokeWidth={2.5} />
    );

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${className}`}
    >
      {icon}
      {status}
    </span>
  );
}

export function SupportBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        ok
          ? "border-[var(--status-live)]/25 bg-[var(--status-live)]/10 text-[var(--status-live)]"
          : "border-border bg-surface-muted text-foreground-muted"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-sm font-semibold">
        {ok ? "Available" : "Unavailable"}
      </p>
    </div>
  );
}
