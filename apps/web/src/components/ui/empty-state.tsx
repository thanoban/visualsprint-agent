import { Inbox } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/40 p-10 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2">
        <Inbox
          size={24}
          strokeWidth={1.5}
          className="text-foreground-subtle"
        />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p
        className={`mt-2 max-w-sm text-sm leading-6 text-foreground-muted ${bodyClassName ?? ""}`}
      >
        {body}
      </p>
    </div>
  );
}
