"use client";

import { dashboardModules } from "@visualsprint/contracts";

import {
  BlockerCard,
  CommitmentCard,
  DecisionCard,
  ScreenEventCard,
  TranscriptCard,
} from "../../../components/domain/record-cards";
import { SignalColumn } from "../../../components/domain/signal-column";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";
import { MemoryStrip } from "./memory-strip";

export function ReasoningPanels() {
  const { meeting } = useMeetingSession();

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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Transcript feed" eyebrow="Live processing">
          <div className="space-y-3">
            {meeting.recentTranscriptSegments.length === 0 ? (
              <EmptyState
                title="No transcript yet"
                body="Transcript segments appear as capture chunks are processed."
              />
            ) : (
              meeting.recentTranscriptSegments.map((segment) => (
                <TranscriptCard key={segment.id} segment={segment} />
              ))
            )}
          </div>
        </Card>

        <Card title="Visual evidence" eyebrow="Frame extraction">
          <div className="space-y-3">
            {meeting.recentScreenEvents.length === 0 ? (
              <EmptyState
                title="No visual evidence yet"
                body="Screen events appear when chunks are processed."
              />
            ) : (
              meeting.recentScreenEvents.map((screenEvent) => (
                <ScreenEventCard key={screenEvent.id} screenEvent={screenEvent} />
              ))
            )}
          </div>
        </Card>
      </div>

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
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </SignalColumn>

          <SignalColumn
            title={moduleMap.commitments?.label ?? "Commitments"}
            emptyTitle="No commitments yet"
            emptyBody="Commitment records will appear as they are extracted."
          >
            {meeting.recentCommitments.map((commitment) => (
              <CommitmentCard key={commitment.id} commitment={commitment} />
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
            <BlockerCard key={blocker.id} blocker={blocker} />
          ))}
        </SignalColumn>
      </Card>
    </div>
  );
}
