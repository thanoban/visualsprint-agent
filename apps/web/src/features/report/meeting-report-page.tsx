"use client";

import Link from "next/link";

import { ErrorBanner } from "../../components/shared/error-banner";
import { EmptyState } from "../../components/ui/empty-state";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { FinalReportView } from "./components/final-report-view";

export function MeetingReportPage() {
  const { meeting, finalReport, error, actionRecommendations } = useMeetingSession();

  if (!meeting) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <EmptyState title="Loading report" body="Fetching meeting report…" />
      </div>
    );
  }

  const reportReady =
    meeting.status === "ended" && finalReport?.meetingId === meeting.id ? finalReport : null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
            {meeting.title}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Meeting report</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted">
            The evidence-backed system of record for what was decided, who owns follow-up, and
            what organizational memory applies.
          </p>
        </div>
        <Link
          className="text-sm font-medium text-brand hover:underline"
          href={`/meetings/${meeting.id}/live`}
        >
          ← Back to live session
        </Link>
      </header>

      {reportReady ? (
        <FinalReportView
          hasRecommendations={actionRecommendations.length > 0}
          meetingId={meeting.id}
          report={reportReady}
        />
      ) : (
        <EmptyState
          title="Report not ready"
          body={
            meeting.status === "ended"
              ? "Generating the final report…"
              : "End the meeting to generate the evidence-backed report."
          }
        />
      )}

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
