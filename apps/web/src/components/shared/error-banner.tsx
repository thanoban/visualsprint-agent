export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--status-error)]/30 bg-[var(--status-error)]/10 px-5 py-4 text-sm text-[var(--status-error)]">
      {message}
    </div>
  );
}
