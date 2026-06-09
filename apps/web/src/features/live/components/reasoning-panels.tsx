"use client";

import { MemoryPanel } from "./memory-panel";
import { RecordsPanels } from "./records-panels";

export function ReasoningPanels() {
  return (
    <div className="space-y-6">
      <MemoryPanel />
      <RecordsPanels />
    </div>
  );
}
