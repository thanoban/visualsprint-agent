"use client";

import type { MeetingStatus } from "@visualsprint/contracts";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { primaryButtonClassName } from "../../components/ui/button-styles";
import { EmptyState } from "../../components/ui/empty-state";
import { PageSkeleton } from "../../components/ui/skeleton";
import { StatusPill } from "../../components/ui/status-pill";
import { useMeetings } from "../../hooks/use-meetings";
import { formatSourceConnector, formatTimestamp } from "../../lib/format";
import { meetingRouteForStatus } from "../../lib/meeting";

const statusFilters: Array<{ id: MeetingStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "live", label: "Live" },
  { id: "ended", label: "Ended" },
];

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
            <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Meetings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted">
              Resume a live session or open the evidence-backed report from a completed meeting.
            </p>
          </div>
          <Link className={primaryButtonClassName} href="/meetings/new">
            New meeting
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
              return (
                <button
                  key={filter.id}
                  aria-selected={active}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand/15 text-brand"
                      : "border border-border bg-surface text-foreground-muted hover:text-foreground"
                  }`}
                  onClick={() => {
                    setStatusFilter(filter.id);
                  }}
                  role="tab"
                  type="button"
                >
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
          <div className="grid gap-4">
            {filteredMeetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={meetingRouteForStatus(meeting)}
                className="rounded-[1.5rem] border border-border bg-surface p-5 transition hover:border-brand/30 hover:shadow-[0_20px_60px_rgba(26,35,50,0.08)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{meeting.title}</h2>
                    <p className="mt-2 text-sm text-foreground-muted">
                      {meeting.participantCount} participants · {formatSourceConnector(meeting.sourceConnector)}
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      Created {formatTimestamp(meeting.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={meeting.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ThemeWrapper>
  );
}
