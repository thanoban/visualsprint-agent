export function EmptyState({
  title,
  body,
  bodyClassName,
}: {
  title: string;
  body: string;
  bodyClassName?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border bg-surface-muted/50 p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className={`mt-2 text-sm leading-6 text-foreground-muted ${bodyClassName ?? ""}`}>{body}</p>
    </div>
  );
}
