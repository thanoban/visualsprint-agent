"use client";

import type { MeetingDetail } from "@visualsprint/contracts";

import { MetricCard } from "../../../components/ui/metric";

export function LiveMetricsRow({ meeting }: { meeting: MeetingDetail }) {
  const { metrics } = meeting;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Decisions" value={String(metrics.decisionsCount)} />
      <MetricCard label="Commitments" value={String(metrics.commitmentsCount)} />
      <MetricCard label="Blockers" value={String(metrics.blockersCount)} />
      <MetricCard label="Screen moments" value={String(metrics.visualEventsCount)} />
      <MetricCard label="Transcript lines" value={String(metrics.transcriptSegmentsCount)} />
      <MetricCard label="Memory matches" value={String(metrics.memoryMatchesCount)} />
      <MetricCard label="Segments" value={String(metrics.captureChunksCount)} />
      <MetricCard label="Open questions" value={String(metrics.openQuestionsCount)} />
    </div>
  );
}
