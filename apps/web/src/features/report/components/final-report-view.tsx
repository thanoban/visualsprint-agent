"use client";

import type { FinalReport } from "@visualsprint/contracts";
import Link from "next/link";

import {
  BlockerCard,
  CommitmentCard,
  DecisionCard,
  MemoryMatchCard,
  OpenQuestionCard,
  SourceModeBadge,
} from "../../../components/domain/record-cards";
import { SignalColumn } from "../../../components/domain/signal-column";
import { secondaryButtonClassName } from "../../../components/ui/button-styles";
import { EmptyState } from "../../../components/ui/empty-state";
import { formatTimestamp } from "../../../lib/format";

export function FinalReportView({
  report,
  meetingId,
  hasRecommendations,
}: {
  report: FinalReport;
  meetingId: string;
  hasRecommendations: boolean;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-surface p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
              Evidence-backed report
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Executive summary</h2>
          </div>
          <SourceModeBadge label="summary" mode={report.summarySource} />
        </div>
        <p className="mt-6 text-lg leading-8 text-foreground">{report.executiveSummary}</p>
        <p className="mt-4 text-sm text-foreground-muted">
          Generated {formatTimestamp(report.generatedAt)}
        </p>
        {hasRecommendations ? (
          <div className="mt-6">
            <Link className={secondaryButtonClassName} href={`/meetings/${meetingId}/actions`}>
              Review action recommendations
            </Link>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SignalColumn
          title="Decision log"
          emptyTitle="No decisions"
          emptyBody="No decisions were recorded for this meeting."
        >
          {report.decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </SignalColumn>

        <SignalColumn
          title="Open questions"
          emptyTitle="No open questions"
          emptyBody="No unresolved questions were captured."
        >
          {report.openQuestions.map((openQuestion) => (
            <OpenQuestionCard key={openQuestion.id} openQuestion={openQuestion} />
          ))}
        </SignalColumn>
      </div>

      <SignalColumn
        title="Commitments and owners"
        emptyTitle="No commitments"
        emptyBody="No follow-up commitments were recorded."
      >
        {report.commitments.map((commitment) => (
          <CommitmentCard key={commitment.id} commitment={commitment} />
        ))}
      </SignalColumn>

      <SignalColumn
        title="Blockers"
        emptyTitle="No blockers"
        emptyBody="No blockers were recorded for this meeting."
      >
        {report.blockers.map((blocker) => (
          <BlockerCard key={blocker.id} blocker={blocker} />
        ))}
      </SignalColumn>

      <section className="rounded-[2rem] border border-[var(--accent-memory)]/25 bg-[var(--accent-memory)]/5 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-memory)]">
          Organizational memory
        </p>
        <h3 className="mt-2 text-2xl font-semibold">Memory highlights</h3>
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
