"use client";

import type { EvidenceReference, FinalReport, ScreenEvent, TranscriptSegment } from "@visualsprint/contracts";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ListChecks } from "lucide-react";

import {
  BlockerCard,
  CommitmentCard,
  DecisionCard,
  MemoryMatchCard,
  OpenQuestionCard,
  SourceModeBadge,
} from "../../../components/domain/record-cards";
import { SignalColumn } from "../../../components/domain/signal-column";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { resolveEvidenceTargets } from "../../../lib/evidence-linking";
import { formatTimestamp } from "../../../lib/format";
import { LinkedEvidenceFeed } from "../../live/components/linked-evidence-feed";
import { ReportToolbar } from "./report-toolbar";

export function FinalReportView({
  report,
  meetingId,
  hasRecommendations,
  transcriptSegments = [],
  screenEvents = [],
}: {
  report: FinalReport;
  meetingId: string;
  hasRecommendations: boolean;
  transcriptSegments?: TranscriptSegment[];
  screenEvents?: ScreenEvent[];
}) {
  const [highlightedTranscriptIds, setHighlightedTranscriptIds] = useState<string[]>([]);
  const [highlightedScreenEventIds, setHighlightedScreenEventIds] = useState<string[]>([]);

  const handleEvidenceSelect = useCallback(
    (reference: EvidenceReference) => {
      const targets = resolveEvidenceTargets(reference, transcriptSegments, screenEvents);
      setHighlightedTranscriptIds(targets.transcriptIds);
      setHighlightedScreenEventIds(targets.screenEventIds);
    },
    [screenEvents, transcriptSegments],
  );

  return (
    <div className="report-document space-y-6 sm:space-y-8">
      <ReportToolbar executiveSummary={report.executiveSummary} />

      <section
        id="report-summary"
        className="scroll-mt-24 rounded-xl border border-border bg-surface p-5 sm:scroll-mt-28 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
              Evidence-backed report
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Executive summary</h2>
          </div>
          <SourceModeBadge label="summary" mode={report.summarySource} />
        </div>
        <p className="mt-5 text-base leading-7 text-foreground sm:mt-6 sm:text-lg sm:leading-8">
          {report.executiveSummary}
        </p>
        <p className="mt-4 text-sm text-foreground-muted">
          Generated {formatTimestamp(report.generatedAt)}
        </p>
        {hasRecommendations ? (
          <div className="mt-6 print:hidden">
            <Link href={`/meetings/${meetingId}/actions`}>
              <Button variant="secondary" size="sm" leftIcon={<ListChecks size={14} strokeWidth={2} />}>
                Review action recommendations
              </Button>
            </Link>
          </div>
        ) : null}
      </section>

      <section id="report-evidence" className="scroll-mt-24 sm:scroll-mt-28 print:hidden">
        {transcriptSegments.length > 0 || screenEvents.length > 0 ? (
          <LinkedEvidenceFeed
            highlightedScreenEventIds={highlightedScreenEventIds}
            highlightedTranscriptIds={highlightedTranscriptIds}
            screenEvents={screenEvents}
            segments={transcriptSegments}
          />
        ) : (
          <EmptyState
            title="No transcript or visual evidence"
            body="Evidence references on report cards will appear here when capture data is available."
          />
        )}
      </section>

      <div id="report-decisions" className="scroll-mt-24 grid gap-5 sm:scroll-mt-28 sm:gap-6 xl:grid-cols-2">
        <SignalColumn
          title="Decision log"
          emptyTitle="No decisions"
          emptyBody="No decisions were recorded for this meeting."
        >
          {report.decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onEvidenceSelect={handleEvidenceSelect}
            />
          ))}
        </SignalColumn>

        <div id="report-questions" className="scroll-mt-24 sm:scroll-mt-28">
          <SignalColumn
            title="Open questions"
            emptyTitle="No open questions"
            emptyBody="No unresolved questions were captured."
          >
            {report.openQuestions.map((openQuestion) => (
              <OpenQuestionCard
                key={openQuestion.id}
                onEvidenceSelect={handleEvidenceSelect}
                openQuestion={openQuestion}
              />
            ))}
          </SignalColumn>
        </div>
      </div>

      <div id="report-commitments" className="scroll-mt-24 sm:scroll-mt-28">
        <SignalColumn
          title="Commitments and owners"
          emptyTitle="No commitments"
          emptyBody="No follow-up commitments were recorded."
        >
          {report.commitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              onEvidenceSelect={handleEvidenceSelect}
            />
          ))}
        </SignalColumn>
      </div>

      <div id="report-blockers" className="scroll-mt-24 sm:scroll-mt-28">
        <SignalColumn
          title="Blockers"
          emptyTitle="No blockers"
          emptyBody="No blockers were recorded for this meeting."
        >
          {report.blockers.map((blocker) => (
            <BlockerCard
              key={blocker.id}
              blocker={blocker}
              onEvidenceSelect={handleEvidenceSelect}
            />
          ))}
        </SignalColumn>
      </div>

      <section
        id="report-memory"
        className="scroll-mt-24 rounded-xl border border-[var(--accent-memory)]/25 bg-[var(--accent-memory)]/5 p-5 sm:scroll-mt-28 sm:p-6"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-memory)]">
          Organizational memory
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Memory highlights</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {report.memoryHighlights.length === 0 ? (
            <EmptyState
              title="No memory highlights"
              body="No cross-meeting memory matches were linked to this report."
            />
          ) : (
            report.memoryHighlights.map((highlight) => (
              <MemoryMatchCard key={highlight.id} memoryMatch={highlight} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
