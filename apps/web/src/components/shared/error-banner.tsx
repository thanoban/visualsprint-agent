import { AlertTriangle } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--status-error)]/30 bg-[var(--status-error)]/10 px-5 py-4 text-sm text-[var(--status-error)]">
      <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
