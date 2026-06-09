"use client";

import type { ActionRecommendation } from "@visualsprint/contracts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { InfoTile } from "../../components/ui/metric";
import { PageSkeleton } from "../../components/ui/skeleton";
import {
  primaryButtonClassName,
  secondaryLightButtonClassName,
} from "../../components/ui/button-styles";
import { ErrorBanner } from "../../components/shared/error-banner";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";

function RecommendationCard({
  recommendation,
  isBusy,
  onApprove,
  onReject,
  onExecute,
}: {
  recommendation: ActionRecommendation;
  isBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onExecute: () => void;
}) {
  return (
    <article className="rounded-[1.2rem] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
            {recommendation.type.replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium uppercase text-foreground-muted">
            {recommendation.status}
          </span>
          <span className="rounded-full bg-[var(--status-draft)]/15 px-2 py-0.5 text-xs font-medium text-[var(--status-draft)]">
            {recommendation.urgency}
          </span>
        </div>
        <span className="text-xs text-foreground-muted">
          confidence {(recommendation.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {recommendation.jiraDetails?.title ?? recommendation.slackDetails?.title ?? "Untitled"}
      </p>
      <p className="mt-1 text-sm leading-6 text-foreground-muted">
        {recommendation.jiraDetails?.description ?? recommendation.slackDetails?.message ?? ""}
      </p>
      {recommendation.executionResult ? (
        <p className="mt-2 text-xs text-foreground-muted">{recommendation.executionResult}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.status === "pending" ? (
          <>
            <button
              className={primaryButtonClassName}
              disabled={isBusy}
              onClick={onApprove}
              type="button"
            >
              Approve
            </button>
            <button
              className={secondaryLightButtonClassName}
              disabled={isBusy}
              onClick={onReject}
              type="button"
            >
              Reject
            </button>
          </>
        ) : null}
        {recommendation.status === "approved" ? (
          <button
            className={primaryButtonClassName}
            disabled={isBusy}
            onClick={onExecute}
            type="button"
          >
            Execute
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ActionsPage() {
  const router = useRouter();
  const {
    meeting,
    actionRecommendations,
    isBusy,
    error,
    generateRecommendations,
    approveRecommendation,
    rejectRecommendation,
    executeRecommendation,
  } = useMeetingSession();

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

  const pendingCount = actionRecommendations.filter((item) => item.status === "pending").length;
  const approvedCount = actionRecommendations.filter((item) => item.status === "approved").length;
  const completedCount = actionRecommendations.filter(
    (item) => item.status === "executed" || item.status === "failed",
  ).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">{meeting.title}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Action recommendations</h1>
        <p className="max-w-2xl text-sm leading-7 text-foreground-muted">
          Review Jira and Slack suggestions generated from the meeting report. Approve before
          execution.
        </p>
      </header>

      {actionRecommendations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="Pending review" value={String(pendingCount)} />
          <InfoTile label="Approved" value={String(approvedCount)} />
          <InfoTile label="Completed" value={String(completedCount)} />
        </div>
      ) : null}

      <Card title="Approval portal" eyebrow="Post-meeting actions">
        <div className="space-y-5">
          <button
            className={secondaryLightButtonClassName}
            disabled={isBusy || meeting.status !== "ended"}
            onClick={() => {
              void generateRecommendations();
            }}
            type="button"
          >
            Generate recommendations
          </button>

          {actionRecommendations.length === 0 ? (
            <EmptyState
              title="No recommendations yet"
              body={
                meeting.status === "ended"
                  ? "Generate recommendations to see Jira and Slack suggestions."
                  : "End the meeting first to generate action recommendations."
              }
            />
          ) : (
            <div className="space-y-3">
              {actionRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  isBusy={isBusy}
                  onApprove={() => {
                    void approveRecommendation(rec.id);
                  }}
                  onExecute={() => {
                    void executeRecommendation(rec.id);
                  }}
                  onReject={() => {
                    void rejectRecommendation(rec.id);
                  }}
                  recommendation={rec}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
