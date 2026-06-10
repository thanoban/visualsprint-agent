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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/50 p-8 text-center">
      <Inbox
        size={40}
        strokeWidth={1.5}
        className="mb-4 text-foreground-subtle"
      />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p
        className={`mt-2 max-w-sm text-sm leading-6 text-foreground-muted ${bodyClassName ?? ""}`}
      >
        {body}
      </p>
    </div>
  );
}
