"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ErrorBanner } from "../../components/shared/error-banner";
import { EmptyState } from "../../components/ui/empty-state";
import { PageSkeleton } from "../../components/ui/skeleton";
import { secondaryButtonClassName } from "../../components/ui/button-styles";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { FinalReportView } from "./components/final-report-view";

export function MeetingReportPage() {
  const router = useRouter();
  const { meeting, finalReport, error, isBusy, actionRecommendations, refreshFinalReport } =
    useMeetingSession();

  useEffect(() => {
    if (!meeting) {
      return;
    }
    if (meeting.status === "draft") {
      router.replace(`/meetings/new?meetingId=${meeting.id}`);
      return;
    }
    if (meeting.status === "live") {
      router.replace(`/meetings/${meeting.id}/live`);
    }
  }, [meeting, router]);

  if (!meeting) {
    return <PageSkeleton />;
  }

  if (meeting.status === "draft" || meeting.status === "live") {
    return <PageSkeleton />;
  }

  const reportReady =
    meeting.status === "ended" && finalReport?.meetingId === meeting.id ? finalReport : null;
  const isGenerating = meeting.status === "ended" && !reportReady;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:px-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">
            {meeting.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Meeting report</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted sm:leading-7">
            The evidence-backed system of record for what was decided, who owns follow-up, and
            what organizational memory applies.
          </p>
        </div>
        <Link className="text-sm font-medium text-brand hover:underline" href="/meetings">
          ← Back to meetings
        </Link>
      </header>

      {reportReady ? (
        <FinalReportView
          hasRecommendations={actionRecommendations.length > 0}
          meetingId={meeting.id}
          report={reportReady}
          screenEvents={meeting.recentScreenEvents}
          transcriptSegments={meeting.recentTranscriptSegments}
        />
      ) : isGenerating ? (
        <div className="space-y-4">
          <PageSkeleton />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-foreground-muted">Generating the final report…</p>
            <button
              className={secondaryButtonClassName}
              disabled={isBusy}
              onClick={() => {
                void refreshFinalReport();
              }}
              type="button"
            >
              {isBusy ? "Retrying…" : "Retry generation"}
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Report not ready"
          body="End the meeting to generate the evidence-backed report."
        />
      )}

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
