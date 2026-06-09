"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useId } from "react";

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
  const tabsetId = useId();
  const active = items.find((item) => item.id === activeId) ?? items[0];

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (items.length === 0) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (index + 1) % items.length;
      onChange(items[nextIndex].id);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previousIndex = (index - 1 + items.length) % items.length;
      onChange(items[previousIndex].id);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      onChange(items[0].id);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(items[items.length - 1].id);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-muted p-1"
        role="tablist"
      >
        {items.map((item, index) => {
          const isActive = item.id === active?.id;
          const tabId = `${tabsetId}-${item.id}-tab`;
          const panelId = `${tabsetId}-${item.id}-panel`;
          if (isActive) {
            return (
              <button
                key={item.id}
                id={tabId}
                aria-controls={panelId}
                aria-selected="true"
                className="shrink-0 rounded-xl bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition"
                onKeyDown={(event) => onTabKeyDown(event, index)}
                onClick={() => onChange(item.id)}
                role="tab"
                tabIndex={0}
                type="button"
              >
                {item.label}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={tabId}
              aria-controls={panelId}
              aria-selected="false"
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-foreground-muted transition hover:text-foreground"
              onKeyDown={(event) => onTabKeyDown(event, index)}
              onClick={() => onChange(item.id)}
              role="tab"
              tabIndex={-1}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${tabsetId}-${active?.id ?? "fallback"}-panel`}
        aria-labelledby={`${tabsetId}-${active?.id ?? "fallback"}-tab`}
        role="tabpanel"
      >
        {active?.content}
      </div>
    </div>
  );
}
