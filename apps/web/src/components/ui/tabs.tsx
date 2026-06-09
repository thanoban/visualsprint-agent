"use client";

import type { ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({
  items,
  activeId,
  onChange,
}: {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const active = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-muted p-1"
        role="tablist"
      >
        {items.map((item) => {
          const isActive = item.id === active?.id;
          return (
            <button
              key={item.id}
              aria-selected={isActive}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
              onClick={() => onChange(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{active?.content}</div>
    </div>
  );
}
