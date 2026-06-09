"use client";

import Link from "next/link";

import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { primaryButtonClassName } from "../../components/ui/button-styles";
import { EmptyState } from "../../components/ui/empty-state";
import { StatusPill } from "../../components/ui/status-pill";
import { useMeetings } from "../../hooks/use-meetings";
import { formatTimestamp } from "../../lib/format";
import { meetingRouteForStatus } from "../../lib/meeting";

export function MeetingsListPage() {
  const { data, isLoading, error } = useMeetings();
  const meetings = data?.meetings ?? [];

  return (
    <ThemeWrapper theme="paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">Workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Meetings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-muted">
              Resume a live session or open the evidence-backed report from a completed meeting.
            </p>
          </div>
          <Link className={primaryButtonClassName} href="/meetings/new">
            New meeting
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-foreground-muted">Loading meetings…</p>
        ) : error ? (
          <EmptyState title="Unable to load meetings" body={String(error)} />
        ) : meetings.length === 0 ? (
          <EmptyState
            title="No meetings yet"
            body="Create your first meeting to start capturing live context and generating reports."
          />
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={meetingRouteForStatus(meeting)}
                className="rounded-[1.5rem] border border-border bg-surface p-5 transition hover:border-brand/30 hover:shadow-[0_20px_60px_rgba(26,35,50,0.08)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{meeting.title}</h2>
                    <p className="mt-2 text-sm text-foreground-muted">
                      {meeting.participantCount} participants · {meeting.sourceConnector.replaceAll("_", " ")}
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
