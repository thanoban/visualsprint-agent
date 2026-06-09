"use client";

import type { EvidenceReference } from "@visualsprint/contracts";
import { dashboardModules } from "@visualsprint/contracts";
import { useCallback, useState } from "react";

import {
  BlockerCard,
  CommitmentCard,
  DecisionCard,
} from "../../../components/domain/record-cards";
import { SignalColumn } from "../../../components/domain/signal-column";
import { Card } from "../../../components/ui/card";
import { resolveEvidenceTargets } from "../../../lib/evidence-linking";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";
import { LinkedEvidenceFeed } from "./linked-evidence-feed";
import { MemoryStrip } from "./memory-strip";

export function ReasoningPanels() {
  const { meeting } = useMeetingSession();
  const [highlightedTranscriptIds, setHighlightedTranscriptIds] = useState<string[]>([]);
  const [highlightedScreenEventIds, setHighlightedScreenEventIds] = useState<string[]>([]);

  const handleEvidenceSelect = useCallback(
    (reference: EvidenceReference) => {
      if (!meeting) {
        return;
      }
      const targets = resolveEvidenceTargets(
        reference,
        meeting.recentTranscriptSegments,
        meeting.recentScreenEvents,
      );
      setHighlightedTranscriptIds(targets.transcriptIds);
      setHighlightedScreenEventIds(targets.screenEventIds);
    },
    [meeting],
  );

  if (!meeting) {
    return null;
  }

  const moduleMap = Object.fromEntries(dashboardModules.map((module) => [module.id, module]));

  return (
    <div className="space-y-6">
      <Card
        title={moduleMap.memory?.label ?? "Cross-meeting memory"}
        eyebrow="Elastic memory strip"
      >
        <MemoryStrip matches={meeting.recentMemoryMatches} />
      </Card>

      <LinkedEvidenceFeed
        highlightedScreenEventIds={highlightedScreenEventIds}
        highlightedTranscriptIds={highlightedTranscriptIds}
        screenEvents={meeting.recentScreenEvents}
        segments={meeting.recentTranscriptSegments}
      />

      <Card
        title={moduleMap.decisions?.label ?? "Decisions with evidence"}
        eyebrow="Live reasoning"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SignalColumn
            title="Decisions"
            emptyTitle="No decisions yet"
            emptyBody="Decisions with evidence references will appear here."
          >
            {meeting.recentDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onEvidenceSelect={handleEvidenceSelect}
              />
            ))}
          </SignalColumn>

          <SignalColumn
            title={moduleMap.commitments?.label ?? "Commitments"}
            emptyTitle="No commitments yet"
            emptyBody="Commitment records will appear as they are extracted."
          >
            {meeting.recentCommitments.map((commitment) => (
              <CommitmentCard
                key={commitment.id}
                commitment={commitment}
                onEvidenceSelect={handleEvidenceSelect}
              />
            ))}
          </SignalColumn>
        </div>
      </Card>

      <Card title={moduleMap.blockers?.label ?? "Recurring blockers"} eyebrow="Risk signals">
        <SignalColumn
          title="Blockers"
          emptyTitle="No blockers yet"
          emptyBody="Blockers with severity flags will surface here."
        >
          {meeting.recentBlockers.map((blocker) => (
            <BlockerCard
              key={blocker.id}
              blocker={blocker}
              onEvidenceSelect={handleEvidenceSelect}
            />
          ))}
        </SignalColumn>
      </Card>
    </div>
  );
}
