"use client";

import type { EvidenceReference } from "@visualsprint/contracts";
import { dashboardModules } from "@visualsprint/contracts";
import { useCallback, useState } from "react";

import {
  BlockerCard,
  CommitmentCard,
  DecisionCard,
  OpenQuestionCard,
} from "../../../components/domain/record-cards";
import { SignalColumn } from "../../../components/domain/signal-column";
import { Card } from "../../../components/ui/card";
import { resolveEvidenceTargets } from "../../../lib/evidence-linking";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";
import { LinkedEvidenceFeed } from "./linked-evidence-feed";

export function RecordsPanels({
  onHighlightChange,
}: {
  onHighlightChange?: (targets: {
    transcriptIds: string[];
    screenEventIds: string[];
  }) => void;
}) {
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
      onHighlightChange?.(targets);
    },
    [meeting, onHighlightChange],
  );

  if (!meeting) {
    return null;
  }

  const moduleMap = Object.fromEntries(dashboardModules.map((module) => [module.id, module]));

  return (
    <div className="space-y-6">
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

      <div className="grid gap-6 xl:grid-cols-2">
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

        <Card title="Open questions" eyebrow="Unresolved topics">
          <SignalColumn
            title="Questions"
            emptyTitle="No open questions yet"
            emptyBody="Unresolved questions will appear as they are extracted."
          >
            {meeting.recentOpenQuestions.map((openQuestion) => (
              <OpenQuestionCard
                key={openQuestion.id}
                onEvidenceSelect={handleEvidenceSelect}
                openQuestion={openQuestion}
              />
            ))}
          </SignalColumn>
        </Card>
      </div>
    </div>
  );
}
