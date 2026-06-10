import type { ReactNode } from "react";

import { EmptyState } from "../ui/empty-state";

export function SignalColumn({
  title,
  emptyTitle,
  emptyBody,
  children,
}: {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {items.length > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand/10 px-1.5 text-[10px] font-bold text-brand">
            {items.length}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? items : <EmptyState title={emptyTitle} body={emptyBody} />}
      </div>
    </section>
  );
}
