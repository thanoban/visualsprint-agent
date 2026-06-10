import { TrendingUp } from "lucide-react";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ink-border-strong)] hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-fg-muted)]">{label}</p>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-[var(--ink-fg)]">
        {value}
      </p>
    </div>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3">
      <TrendingUp size={16} strokeWidth={2} className="text-foreground-subtle" />
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{label}</p>
        <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}
