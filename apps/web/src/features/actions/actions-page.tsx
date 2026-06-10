"use client";

import type { ActionRecommendation } from "@visualsprint/contracts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Zap,
  Ticket,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { InfoTile } from "../../components/ui/metric";
import { PageSkeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { ErrorBanner } from "../../components/shared/error-banner";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
};

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
  const isJira = recommendation.type.startsWith("jira_");
  const typeIcon = isJira ? (
    <Ticket size={14} strokeWidth={2} />
  ) : (
    <MessageSquare size={14} strokeWidth={2} />
  );

  const typeLabel = recommendation.type.replace(/_/g, " ");
  const title =
    recommendation.jiraDetails?.title ??
    recommendation.slackDetails?.title ??
    "Untitled";
  const description =
    recommendation.jiraDetails?.description ??
    recommendation.slackDetails?.message ??
    "";

  return (
    <motion.article
      variants={cardItem}
      className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
            {typeIcon}
            {typeLabel}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium uppercase ${
              recommendation.status === "pending"
                ? "bg-[var(--status-draft)]/15 text-[var(--status-draft)]"
                : recommendation.status === "approved"
                  ? "bg-[var(--status-live)]/15 text-[var(--status-live)]"
                  : "bg-surface-muted text-foreground-muted"
            }`}
          >
            {recommendation.status}
          </span>
          <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-[var(--status-draft)]">
            {recommendation.urgency}
          </span>
        </div>
        <span className="text-xs text-foreground-muted">
          confidence {(recommendation.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-foreground-muted">{description}</p>
      {recommendation.executionResult ? (
        <p className="mt-2 text-xs text-foreground-muted">{recommendation.executionResult}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {recommendation.status === "pending" ? (
          <>
            <Button
              size="sm"
              leftIcon={<CheckCircle2 size={14} strokeWidth={2} />}
              disabled={isBusy}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<XCircle size={14} strokeWidth={2} />}
              disabled={isBusy}
              onClick={onReject}
            >
              Reject
            </Button>
          </>
        ) : null}
        {recommendation.status === "approved" ? (
          <Button
            size="sm"
            leftIcon={<Zap size={14} strokeWidth={2} />}
            disabled={isBusy}
            onClick={onExecute}
          >
            Execute
          </Button>
        ) : null}
      </div>
    </motion.article>
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

  const pendingCount = actionRecommendations.filter(
    (item) => item.status === "pending",
  ).length;
  const approvedCount = actionRecommendations.filter(
    (item) => item.status === "approved",
  ).length;
  const completedCount = actionRecommendations.filter(
    (item) => item.status === "executed" || item.status === "failed",
  ).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{meeting.title}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Action recommendations
        </h1>
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
          <Button
            variant="secondary"
            disabled={isBusy || meeting.status !== "ended"}
            onClick={() => {
              void generateRecommendations();
            }}
          >
            Generate recommendations
          </Button>

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
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
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
            </motion.div>
          )}
        </div>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
