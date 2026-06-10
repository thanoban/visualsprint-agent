import { TrendingUp } from "lucide-react";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ink-border-strong)] hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-fg-muted)]">{label}</p>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-[var(--ink-fg)]">
        {value}
      </p>
    </div>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-surface-muted px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
        <TrendingUp size={16} strokeWidth={2} className="text-brand" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{label}</p>
        <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}
