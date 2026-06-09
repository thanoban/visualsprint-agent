import type {
  CaptureSessionSummary,
  DecisionRecord,
  MeetingDetail,
} from "@visualsprint/contracts";

export type CapturePhase = "idle" | "requesting" | "recording" | "stopping";

export function StatusPill({ status }: { status: MeetingDetail["status"] }) {
  const variant =
    status === "live"
      ? "border-[var(--status-live)]/30 bg-[var(--status-live)]/15 text-[var(--status-live)]"
      : status === "ended"
        ? "border-border bg-surface-muted text-foreground-muted"
        : "border-[var(--status-draft)]/30 bg-[var(--status-draft)]/15 text-[var(--status-draft)]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${variant}`}
    >
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

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${variant}`}
    >
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

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${className}`}
    >
      {status}
    </span>
  );
}

export function SupportBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-3 ${
        ok
          ? "border-[var(--status-live)]/25 bg-[var(--status-live)]/10 text-[var(--status-live)]"
          : "border-border bg-surface-muted text-foreground-muted"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{ok ? "Available" : "Unavailable"}</p>
    </div>
  );
}
