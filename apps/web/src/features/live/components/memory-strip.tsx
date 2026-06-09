"use client";

import type { MemoryMatch } from "@visualsprint/contracts";

import { MemoryMatchCard } from "../../../components/domain/record-cards";
import { EmptyState } from "../../../components/ui/empty-state";

export function MemoryStrip({ matches }: { matches: MemoryMatch[] }) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No cross-meeting memory yet"
        body="Elastic memory matches will appear here when recurring or reopened history is detected."
      />
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {matches.map((match) => (
        <div key={match.id} className="min-w-[18rem] max-w-sm shrink-0">
          <MemoryMatchCard memoryMatch={match} />
        </div>
      ))}
    </div>
  );
}
