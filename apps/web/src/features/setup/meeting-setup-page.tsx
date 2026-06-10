"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Radio, CheckCircle2 } from "lucide-react";

import { ErrorBanner } from "../../components/shared/error-banner";
import { StatusPill } from "../../components/ui/status-pill";
import { Button } from "../../components/ui/button";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";
import { CaptureReadiness } from "./components/capture-readiness";
import { CaptureStepper } from "./components/capture-stepper";
import { CreateMeetingForm } from "./components/create-meeting-form";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
};

export function MeetingSetupPage() {
  const { meeting, meetings, error, selectMeeting, capturePhase } = useMeetingSession();

  const statusIcon = (status: string) => {
    if (status === "live") return <Radio size={14} strokeWidth={2} />;
    if (status === "ended") return <CheckCircle2 size={14} strokeWidth={2} />;
    return <Clock size={14} strokeWidth={2} />;
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-8 sm:py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Setup</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Prepare your meeting</h1>
        <p className="max-w-2xl text-sm leading-6 text-foreground-muted sm:leading-7">
          Create a session, verify browser capture support, then start the meeting to open the live
          workspace.
        </p>
      </header>

      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Pipeline</p>
        <CaptureStepper capturePhase={capturePhase} meeting={meeting} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <CreateMeetingForm />
          <CaptureReadiness />
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Sessions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent meetings</h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-5 space-y-3"
            >
              {meetings.length === 0 ? (
                <p className="text-sm text-foreground-muted">No meetings yet.</p>
              ) : (
                meetings.map((item) => (
                  <motion.button
                    key={item.id}
                    variants={rowItem}
                    className={`group flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-left transition ${
                      meeting?.id === item.id
                        ? "border-brand bg-brand/10"
                        : "border-border bg-surface-muted hover:border-border-strong hover:shadow-sm"
                    }`}
                    onClick={() => {
                      void selectMeeting(item.id);
                    }}
                    type="button"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {item.participantCount} participants
                      </p>
                    </div>
                    <StatusPill status={item.status} />
                  </motion.button>
                ))
              )}
            </motion.div>
            {meeting ? (
              <div className="mt-5">
                <Link
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                  href={
                    meeting.status === "live"
                      ? `/meetings/${meeting.id}/live`
                      : meeting.status === "ended"
                        ? `/meetings/${meeting.id}/report`
                        : `/meetings/new`
                  }
                >
                  Open selected meeting
                  <ArrowRight size={14} strokeWidth={2} />
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
