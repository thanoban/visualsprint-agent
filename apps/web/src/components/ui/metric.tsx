export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-fg-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--ink-fg)]">{value}</p>
    </div>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
