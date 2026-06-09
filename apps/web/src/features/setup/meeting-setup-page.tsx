"use client";

import Link from "next/link";

import { ErrorBanner } from "../../components/shared/error-banner";
import { StatusPill } from "../../components/ui/status-pill";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { CaptureReadiness } from "./components/capture-readiness";
import { CreateMeetingForm } from "./components/create-meeting-form";

export function MeetingSetupPage() {
  const { meeting, meetings, error, selectMeeting } = useMeetingSession();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">Setup</p>
        <h1 className="text-4xl font-semibold tracking-tight">Prepare your meeting</h1>
        <p className="max-w-2xl text-sm leading-7 text-foreground-muted">
          Create a session, verify browser capture support, then start the meeting to enter the
          live dashboard.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <CreateMeetingForm />
          <CaptureReadiness />
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">Sessions</p>
            <h2 className="mt-2 text-2xl font-semibold">Recent meetings</h2>
            <div className="mt-5 space-y-3">
              {meetings.length === 0 ? (
                <p className="text-sm text-foreground-muted">No meetings yet.</p>
              ) : (
                meetings.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full rounded-[1.2rem] border p-4 text-left transition ${
                      meeting?.id === item.id
                        ? "border-brand bg-brand/10"
                        : "border-border bg-surface-muted hover:border-brand/30"
                    }`}
                    onClick={() => {
                      void selectMeeting(item.id);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-foreground-muted">
                          {item.participantCount} participants
                        </p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                  </button>
                ))
              )}
            </div>
            {meeting ? (
              <div className="mt-5">
                <Link
                  className="text-sm font-medium text-brand hover:underline"
                  href={
                    meeting.status === "live"
                      ? `/meetings/${meeting.id}/live`
                      : meeting.status === "ended"
                        ? `/meetings/${meeting.id}/report`
                        : `/meetings/new`
                  }
                >
                  Open selected meeting →
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
