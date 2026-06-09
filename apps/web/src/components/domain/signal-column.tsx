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
    <section className="rounded-[1.25rem] border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? items : <EmptyState title={emptyTitle} body={emptyBody} />}
      </div>
    </section>
  );
}
