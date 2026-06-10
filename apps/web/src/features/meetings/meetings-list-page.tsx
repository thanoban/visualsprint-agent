"use client";

import type { MeetingStatus } from "@visualsprint/contracts";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutList, PlusCircle, Radio, Clock, CheckCircle2, ChevronRight } from "lucide-react";

import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { PageSkeleton } from "../../components/ui/skeleton";
import { StatusPill } from "../../components/ui/status-pill";
import { useMeetings } from "../../hooks/use-meetings";
import { formatSourceConnector, formatTimestamp } from "../../lib/format";
import { meetingRouteForStatus } from "../../lib/meeting";

const statusFilters: Array<{ id: MeetingStatus | "all"; label: string; icon: typeof LayoutList }> = [
  { id: "all", label: "All", icon: LayoutList },
  { id: "draft", label: "Draft", icon: Clock },
  { id: "live", label: "Live", icon: Radio },
  { id: "ended", label: "Ended", icon: CheckCircle2 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
};

export function MeetingsListPage() {
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "all">("all");
  const { data, isLoading, error } = useMeetings();
  const meetings = data?.meetings ?? [];
  const filteredMeetings = useMemo(
    () =>
      statusFilter === "all"
        ? meetings
        : meetings.filter((meeting) => meeting.status === statusFilter),
    [meetings, statusFilter],
  );

  return (
    <ThemeWrapper theme="paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Meetings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted">
              Resume a live session or open the evidence-backed report from a completed meeting.
            </p>
          </div>
          <Link href="/meetings/new">
            <Button leftIcon={<PlusCircle size={16} strokeWidth={2} />}>
              New meeting
            </Button>
          </Link>
        </div>

        {!isLoading && !error && meetings.length > 0 ? (
          <div
            aria-label="Filter meetings by status"
            className="flex flex-wrap gap-2"
            role="tablist"
          >
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.id;
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  aria-selected={active}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand/15 text-brand"
                      : "border border-border bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-2"
                  }`}
                  onClick={() => {
                    setStatusFilter(filter.id);
                  }}
                  role="tab"
                  type="button"
                >
                  <Icon size={14} strokeWidth={2} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {isLoading ? (
          <PageSkeleton />
        ) : error ? (
          <EmptyState title="Unable to load meetings" body={String(error)} />
        ) : meetings.length === 0 ? (
          <EmptyState
            title="No meetings yet"
            body="Create your first meeting to start capturing live context and generating reports."
          />
        ) : filteredMeetings.length === 0 ? (
          <EmptyState
            title={`No ${statusFilter} meetings`}
            body="Try another filter or create a new meeting."
          />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3"
          >
            {filteredMeetings.map((meeting) => (
              <motion.div key={meeting.id} variants={rowItem}>
                <Link
                  href={meetingRouteForStatus(meeting)}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md sm:p-5"
                >
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight text-foreground transition group-hover:text-brand sm:text-lg">
                      {meeting.title}
                    </h2>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {meeting.participantCount} participants · {formatSourceConnector(meeting.sourceConnector)} · Created{" "}
                      {formatTimestamp(meeting.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusPill status={meeting.status} />
                    <ChevronRight
                      size={18}
                      strokeWidth={2}
                      className="text-foreground-subtle transition group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </ThemeWrapper>
  );
}
