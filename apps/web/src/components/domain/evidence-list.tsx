import type { DecisionRecord, EvidenceReference } from "@visualsprint/contracts";

import { formatEvidenceReference } from "../../lib/format";

export function EvidenceList({
  evidence,
  onSelect,
}: {
  evidence: DecisionRecord["evidence"];
  onSelect?: (reference: EvidenceReference) => void;
}) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {evidence.map((reference) => {
        const content = formatEvidenceReference(reference);
        if (!onSelect) {
          return (
            <p
              key={`${reference.clientChunkId}-${reference.transcriptRef ?? "none"}-${reference.frameRef ?? "none"}-${reference.tStartMs}`}
              className="rounded-xl bg-surface-muted px-3 py-2 text-xs leading-5 text-foreground-muted"
            >
              {content}
            </p>
          );
        }

        return (
          <button
            key={`${reference.clientChunkId}-${reference.transcriptRef ?? "none"}-${reference.frameRef ?? "none"}-${reference.tStartMs}`}
            className="w-full rounded-xl bg-surface-muted px-3 py-2 text-left text-xs leading-5 text-foreground-muted transition hover:bg-accent/10 hover:text-foreground"
            onClick={() => onSelect(reference)}
            type="button"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
