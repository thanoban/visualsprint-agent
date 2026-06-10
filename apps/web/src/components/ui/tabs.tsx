"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useId } from "react";
import { motion } from "framer-motion";

export type TabItem = {
  id: string;
  label: string;
  icon?: ReactNode;
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
        className="relative flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-muted p-1.5"
        role="tablist"
      >
        {items.map((item, index) => {
          const isActive = item.id === active?.id;
          const tabId = `${tabsetId}-${item.id}-tab`;
          const panelId = `${tabsetId}-${item.id}-panel`;
          return (
            <button
              key={item.id}
              id={tabId}
              aria-controls={panelId}
              aria-selected={isActive}
              className={`relative z-10 flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              }`}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              onClick={() => onChange(item.id)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {isActive && (
                <motion.div
                  layoutId={`activeTab-${tabsetId}`}
                  className="absolute inset-0 rounded-lg bg-surface shadow-sm border border-border"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div
        id={`${tabsetId}-${active?.id ?? "fallback"}-panel`}
        aria-labelledby={`${tabsetId}-${active?.id ?? "fallback"}-tab`}
        role="tabpanel"
      >
        <motion.div
          key={active?.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {active?.content}
        </motion.div>
      </div>
    </div>
  );
}
