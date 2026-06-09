import type { DecisionRecord } from "@visualsprint/contracts";

import { formatEvidenceReference } from "../../lib/format";

export function EvidenceList({
  evidence,
}: {
  evidence: DecisionRecord["evidence"];
}) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {evidence.map((reference) => (
        <p
          key={`${reference.clientChunkId}-${reference.transcriptRef ?? "none"}-${reference.frameRef ?? "none"}-${reference.tStartMs}`}
          className="rounded-xl bg-surface-muted px-3 py-2 text-xs leading-5 text-foreground-muted"
        >
          {formatEvidenceReference(reference)}
        </p>
      ))}
    </div>
  );
}
