"use client";

import {
  dashboardModules,
  partnerTracks,
  sourceConnectors,
  type CreateMeetingRequest,
  type MeetingDetail,
  type MeetingSummary,
} from "@visualsprint/contracts";
import { startTransition, useEffect, useState, useSyncExternalStore } from "react";

import {
  createMeeting,
  endMeeting,
  getApiBaseUrl,
  getMeeting,
  listMeetings,
  startMeeting,
} from "../lib/api";

const initialDraft: CreateMeetingRequest = {
  title: "Sprint planning sync",
  participantCount: 4,
  sourceConnector: "browser_live_capture",
  notes: "Focus on blockers, ownership, and any recurring release risks.",
};

type CaptureSupport = {
  mediaDevices: boolean;
  displayCapture: boolean;
  mediaRecorder: boolean;
};

export function MeetingDashboard() {
  const [draft, setDraft] = useState<CreateMeetingRequest>(initialDraft);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetail | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClient = useSyncExternalStore(
    subscribeToBrowserAvailability,
    () => true,
    () => false,
  );
  
  async function refreshMeetings() {
    const response = await listMeetings();
    startTransition(() => {
      setMeetings(response.meetings);
    });
    return response.meetings;
  }

  async function refreshMeeting(meetingId: string) {
    const response = await getMeeting(meetingId);
    startTransition(() => {
      setSelectedMeeting(response.meeting);
    });
    return response.meeting;
  }

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const meetingList = await refreshMeetings();
        if (meetingList.length > 0) {
          await refreshMeeting(meetingList[0].id);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    })();
  }, []);

  const captureSupport: CaptureSupport | null =
    !isClient
      ? null
      : {
          mediaDevices: typeof navigator.mediaDevices !== "undefined",
          displayCapture:
            typeof navigator.mediaDevices !== "undefined" &&
            typeof navigator.mediaDevices.getDisplayMedia === "function",
          mediaRecorder: typeof window.MediaRecorder !== "undefined",
        };

  async function handleCreateMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);

    try {
      const response = await createMeeting(draft);
      const meetingList = await refreshMeetings();
      startTransition(() => {
        setSelectedMeeting(response.meeting);
      });
      if (!meetingList.some((meeting) => meeting.id === response.meeting.id)) {
        await refreshMeetings();
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSelectMeeting(meetingId: string) {
    setError(null);
    try {
      await refreshMeeting(meetingId);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  async function handleLifecycleAction(action: "start" | "end") {
    if (!selectedMeeting) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const response =
        action === "start"
          ? await startMeeting(selectedMeeting.id)
          : await endMeeting(selectedMeeting.id);

      startTransition(() => {
        setSelectedMeeting(response.meeting);
      });
      await refreshMeetings();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_28%),linear-gradient(180deg,#09121b_0%,#0a1521_30%,#f4efe2_30%,#f7f4ec_100%)] text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-[0_30px_110px_rgba(2,8,23,0.48)] backdrop-blur">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-100">
                Phase 2 meeting lifecycle
              </p>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Create the meeting session before the agents can reason.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  This slice wires the product shell to the deterministic control
                  plane: meeting setup, session state, connector choice, and
                  browser capture readiness now exist as real application flows.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-200 sm:grid-cols-2 lg:min-w-[24rem]">
              <Metric label="Selected track" value="Elastic" />
              <Metric label="API base URL" value={getApiBaseUrl()} />
              <Metric
                label="Meetings in memory"
                value={String(meetings.length)}
              />
              <Metric
                label="Selected status"
                value={selectedMeeting?.status ?? "No meeting yet"}
              />
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <Card dark title="Create meeting shell" eyebrow="Control plane">
              <form className="space-y-5" onSubmit={handleCreateMeeting}>
                <Field label="Meeting title">
                  <input
                    className={inputClassName}
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Participant count">
                    <input
                      className={inputClassName}
                      min={1}
                      max={50}
                      type="number"
                      value={draft.participantCount}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          participantCount: Number(event.target.value) || 1,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Primary connector">
                    <select
                      className={inputClassName}
                      value={draft.sourceConnector}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          sourceConnector: event.target.value as CreateMeetingRequest["sourceConnector"],
                        }))
                      }
                    >
                      {sourceConnectors.map((connector) => (
                        <option key={connector.slug} value={connector.slug}>
                          {connector.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Operator notes">
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y`}
                    value={draft.notes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={isBusy}
                    type="submit"
                  >
                    {isBusy ? "Creating..." : "Create meeting"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={isBusy}
                    onClick={async () => {
                      setError(null);
                      try {
                        const meetingList = await refreshMeetings();
                        if (!selectedMeeting && meetingList.length > 0) {
                          await refreshMeeting(meetingList[0].id);
                        }
                      } catch (refreshError) {
                        setError(getErrorMessage(refreshError));
                      }
                    }}
                    type="button"
                  >
                    Refresh sessions
                  </button>
                </div>
              </form>
            </Card>

            <Card title="Browser capture readiness" eyebrow="Connector check">
              <div className="grid gap-3 sm:grid-cols-3">
                <SupportBadge
                  label="MediaDevices"
                  ok={captureSupport?.mediaDevices ?? false}
                />
                <SupportBadge
                  label="getDisplayMedia"
                  ok={captureSupport?.displayCapture ?? false}
                />
                <SupportBadge
                  label="MediaRecorder"
                  ok={captureSupport?.mediaRecorder ?? false}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                This does not start capture yet. It confirms whether the current
                browser environment is capable of supporting the planned live
                browser connector.
              </p>
            </Card>

            <Card title="Meeting queue" eyebrow="Local development state">
              <div className="space-y-3">
                {meetings.length === 0 ? (
                  <EmptyState
                    title="No meetings yet"
                    body="Create the first session to exercise the deterministic meeting lifecycle."
                  />
                ) : (
                  meetings.map((meeting) => (
                    <button
                      key={meeting.id}
                      className={`w-full rounded-[1.2rem] border p-4 text-left transition ${
                        selectedMeeting?.id === meeting.id
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-900/10 bg-white text-slate-900 hover:border-slate-900/25"
                      }`}
                      onClick={() => {
                        void handleSelectMeeting(meeting.id);
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{meeting.title}</p>
                          <p
                            className={`mt-1 text-xs ${
                              selectedMeeting?.id === meeting.id
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}
                          >
                            {meeting.sourceConnector} · {meeting.participantCount} participants
                          </p>
                        </div>
                        <StatusPill status={meeting.status} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card dark title="Selected meeting" eyebrow="Lifecycle state">
              {selectedMeeting ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-white">
                        {selectedMeeting.title}
                      </h2>
                      <p className="text-sm leading-6 text-slate-300">
                        {selectedMeeting.notes || "No operator notes were added for this meeting."}
                      </p>
                    </div>
                    <StatusPill status={selectedMeeting.status} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <MetricCard
                      label="Participants"
                      value={String(selectedMeeting.participantCount)}
                    />
                    <MetricCard
                      label="Connector"
                      value={selectedMeeting.sourceConnector}
                    />
                    <MetricCard
                      label="Track"
                      value={selectedMeeting.primaryTrack}
                    />
                    <MetricCard
                      label="Capture events"
                      value={String(selectedMeeting.metrics.captureEventsCount)}
                    />
                    <MetricCard
                      label="Transcript segments"
                      value={String(selectedMeeting.metrics.transcriptSegmentsCount)}
                    />
                    <MetricCard
                      label="Memory matches"
                      value={String(selectedMeeting.metrics.memoryMatchesCount)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className={primaryButtonClassName}
                      disabled={isBusy || selectedMeeting.status !== "draft"}
                      onClick={() => {
                        void handleLifecycleAction("start");
                      }}
                      type="button"
                    >
                      {selectedMeeting.status === "draft"
                        ? "Start meeting"
                        : "Meeting started"}
                    </button>
                    <button
                      className={secondaryDarkButtonClassName}
                      disabled={isBusy || selectedMeeting.status === "ended"}
                      onClick={() => {
                        void handleLifecycleAction("end");
                      }}
                      type="button"
                    >
                      {selectedMeeting.status === "ended"
                        ? "Meeting ended"
                        : "End meeting"}
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  bodyClassName="text-slate-300"
                  title="No meeting selected"
                  body="Create or choose a meeting to inspect the live session state."
                />
              )}
            </Card>

            <Card title="Lifecycle timeline" eyebrow="Deterministic events">
              {selectedMeeting ? (
                <div className="space-y-4">
                  {selectedMeeting.latestEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-[1.25rem] border border-slate-900/10 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {event.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {event.detail}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
                            {event.kind}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(event.at)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No timeline yet"
                  body="Once a meeting exists, the control plane will show lifecycle events here before agent outputs arrive."
                />
              )}
            </Card>

            <Card title="Planned live modules" eyebrow="UI target">
              <div className="grid gap-4 sm:grid-cols-2">
                {dashboardModules.map((module) => (
                  <article
                    key={module.id}
                    className="rounded-[1.2rem] border border-slate-900/10 bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {module.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {module.description}
                    </p>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <footer className="rounded-[1.5rem] border border-slate-900/10 bg-[#f0eadc] px-5 py-4 text-sm leading-6 text-slate-700">
          <p className="font-medium text-slate-900">Current implementation note</p>
          <p>
            This slice implements real meeting lifecycle state and dashboard/API
            integration. Agent execution, live chunk uploads, transcript
            generation, and Elastic memory queries are still upcoming slices.
          </p>
          <p className="mt-2">
            Official track options: {partnerTracks.map((track) => track.label).join(", ")}.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Card({
  title,
  eyebrow,
  children,
  dark = false,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] ${
        dark
          ? "border-white/10 bg-slate-950/80 text-slate-100"
          : "border-slate-900/10 bg-[#f8f5ee] text-slate-900"
      }`}
    >
      <p className={`text-xs uppercase tracking-[0.24em] ${dark ? "text-emerald-100/75" : "text-slate-500"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-2 text-2xl font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function SupportBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-3 ${
        ok
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-900"
          : "border-slate-900/10 bg-slate-200 text-slate-700"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{ok ? "Available" : "Unavailable"}</p>
    </div>
  );
}

function StatusPill({ status }: { status: MeetingDetail["status"] }) {
  const styles =
    status === "live"
      ? "bg-emerald-500/15 text-emerald-100 border-emerald-400/30"
      : status === "ended"
        ? "bg-slate-200 text-slate-700 border-slate-300"
        : "bg-amber-400/15 text-amber-100 border-amber-300/30";

  const lightStyles =
    status === "live"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "ended"
        ? "bg-slate-200 text-slate-700 border-slate-300"
        : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${
        status === "draft" || status === "ended" ? lightStyles : styles
      }`}
    >
      {status}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  body,
  bodyClassName,
}: {
  title: string;
  body: string;
  bodyClassName?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className={`mt-2 text-sm leading-6 text-slate-600 ${bodyClassName ?? ""}`}>{body}</p>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while talking to the VisualSprint API.";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function subscribeToBrowserAvailability() {
  return () => {};
}

const inputClassName =
  "w-full rounded-[1rem] border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/35";

const primaryButtonClassName =
  "rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryDarkButtonClassName =
  "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";
