"use client";

import {
  captureStages,
  dashboardModules,
  partnerTracks,
  sourceConnectors,
  type BlockerRecord,
  type CaptureChunkSummary,
  type CaptureSessionSummary,
  type CommitmentRecord,
  type CreateMeetingRequest,
  type DecisionRecord,
  type MemoryMatch,
  type MeetingDetail,
  type MeetingSummary,
  type OpenQuestionRecord,
  type RegisterCaptureChunkRequest,
  type ScreenEvent,
  type TranscriptSegment,
} from "@visualsprint/contracts";
import { startTransition, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  completeCaptureChunkUpload,
  completeCaptureSession,
  createMeeting,
  endMeeting,
  getApiBaseUrl,
  getMeeting,
  listMeetings,
  registerCaptureChunk,
  startCaptureSession,
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

type CapturePhase = "idle" | "requesting" | "recording" | "stopping";

type CaptureResources = {
  stream: MediaStream;
  cleanup: () => void;
  hasDisplayVideo: boolean;
  hasDisplayAudio: boolean;
  hasMicrophoneAudio: boolean;
};

export function MeetingDashboard() {
  const [draft, setDraft] = useState<CreateMeetingRequest>(initialDraft);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDetail | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("idle");
  const isClient = useSyncExternalStore(
    subscribeToBrowserAvailability,
    () => true,
    () => false,
  );

  const recorderRef = useRef<MediaRecorder | null>(null);
  const cleanupCaptureRef = useRef<(() => void) | null>(null);
  const chunkSequenceRef = useRef(0);
  const chunkStartedAtRef = useRef<number>(0);
  const chunkRequestQueueRef = useRef<Promise<void>>(Promise.resolve());
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const stopResolverRef = useRef<(() => void) | null>(null);

  function applyMeeting(meeting: MeetingDetail) {
    startTransition(() => {
      setSelectedMeeting(meeting);
      setMeetings((current) => upsertMeetingSummary(current, toMeetingSummary(meeting)));
    });
  }

  async function refreshMeetings() {
    const response = await listMeetings();
    startTransition(() => {
      setMeetings(response.meetings);
    });
    return response.meetings;
  }

  async function refreshMeeting(meetingId: string) {
    const response = await getMeeting(meetingId);
    applyMeeting(response.meeting);
    return response.meeting;
  }

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const meetingResponse = await listMeetings();
        startTransition(() => {
          setMeetings(meetingResponse.meetings);
        });
        const meetingList = meetingResponse.meetings;
        if (meetingList.length > 0) {
          const detailResponse = await getMeeting(meetingList[0].id);
          applyMeeting(detailResponse.meeting);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      cleanupCaptureRef.current?.();
    };
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
      applyMeeting(response.meeting);
      await refreshMeetings();
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
      if (action === "end" && capturePhase === "recording") {
        await stopBrowserCapture();
      }

      const response =
        action === "start"
          ? await startMeeting(selectedMeeting.id)
          : await endMeeting(selectedMeeting.id);

      applyMeeting(response.meeting);
      await refreshMeetings();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    } finally {
      setIsBusy(false);
    }
  }

  async function beginBrowserCapture() {
    if (!selectedMeeting) {
      return;
    }
    if (selectedMeeting.sourceConnector !== "browser_live_capture") {
      setError("Browser capture is only available for meetings using the browser_live_capture connector.");
      return;
    }
    if (selectedMeeting.status !== "live") {
      setError("Start the meeting session before beginning browser capture.");
      return;
    }
    if (!captureSupport?.displayCapture || !captureSupport.mediaRecorder) {
      setError("This browser environment does not support live browser capture.");
      return;
    }

    setCapturePhase("requesting");
    setError(null);

    let resources: CaptureResources | null = null;

    try {
      resources = await buildCaptureResources();
      const preferredMimeType = resolveRecorderMimeType();
      const response = await startCaptureSession(selectedMeeting.id, {
        recorderMimeType: preferredMimeType || null,
        hasDisplayVideo: resources.hasDisplayVideo,
        hasDisplayAudio: resources.hasDisplayAudio,
        hasMicrophoneAudio: resources.hasMicrophoneAudio,
      });

      const recorder =
        preferredMimeType.length > 0
          ? new MediaRecorder(resources.stream, { mimeType: preferredMimeType })
          : new MediaRecorder(resources.stream);

      recorderRef.current = recorder;
      cleanupCaptureRef.current = resources.cleanup;
      chunkSequenceRef.current = 0;
      chunkStartedAtRef.current = Date.now();
      stopPromiseRef.current = null;
      stopResolverRef.current = null;

      recorder.ondataavailable = (event) => {
        if (!selectedMeeting || event.data.size === 0) {
          return;
        }

        const now = Date.now();
        const sequence = chunkSequenceRef.current + 1;
        const payload: RegisterCaptureChunkRequest = {
          clientChunkId: buildClientChunkId(response.captureSession.id, sequence),
          sequence,
          durationMs: Math.max(now - chunkStartedAtRef.current, 250),
          byteSize: event.data.size,
          mimeType: event.data.type || preferredMimeType || "video/webm",
        };
        chunkSequenceRef.current = sequence;
        chunkStartedAtRef.current = now;

        chunkRequestQueueRef.current = chunkRequestQueueRef.current.then(async () => {
          const chunkResponse = await registerCaptureChunk(selectedMeeting.id, payload);
          applyMeeting(chunkResponse.meeting);

          const uploadResponse = await completeCaptureChunkUpload(selectedMeeting.id, {
            clientChunkId: payload.clientChunkId,
          });
          applyMeeting(uploadResponse.meeting);
        }).catch((chunkError) => {
          setError(getErrorMessage(chunkError));
        });
      };

      recorder.onstop = () => {
        void finalizeCaptureSession(selectedMeeting.id);
      };

      recorder.start(4000);
      applyMeeting(response.meeting);
      setCapturePhase("recording");
    } catch (captureError) {
      resources?.cleanup();
      cleanupCaptureRef.current = null;
      recorderRef.current = null;
      setCapturePhase("idle");
      setError(getErrorMessage(captureError));
    }
  }

  async function stopBrowserCapture() {
    if (!selectedMeeting) {
      return;
    }
    if (capturePhase !== "recording" || !recorderRef.current) {
      return;
    }

    setCapturePhase("stopping");

    if (!stopPromiseRef.current) {
      stopPromiseRef.current = new Promise<void>((resolve) => {
        stopResolverRef.current = resolve;
      });
    }

    recorderRef.current.stop();
    await stopPromiseRef.current;
  }

  async function finalizeCaptureSession(meetingId: string) {
    try {
      await chunkRequestQueueRef.current;
      const response = await completeCaptureSession(meetingId);
      applyMeeting(response.meeting);
    } catch (captureError) {
      setError(getErrorMessage(captureError));
    } finally {
      cleanupCaptureRef.current?.();
      cleanupCaptureRef.current = null;
      recorderRef.current = null;
      setCapturePhase("idle");
      stopResolverRef.current?.();
      stopResolverRef.current = null;
      stopPromiseRef.current = null;
    }
  }

  const canStartCapture =
    selectedMeeting?.status === "live" &&
    selectedMeeting.sourceConnector === "browser_live_capture" &&
    capturePhase === "idle";

  const recentChunks = selectedMeeting?.recentCaptureChunks ?? [];
  const activeCaptureSession = selectedMeeting?.activeCaptureSession;
  const recentTranscriptSegments = selectedMeeting?.recentTranscriptSegments ?? [];
  const recentScreenEvents = selectedMeeting?.recentScreenEvents ?? [];
  const recentDecisions = selectedMeeting?.recentDecisions ?? [];
  const recentCommitments = selectedMeeting?.recentCommitments ?? [];
  const recentBlockers = selectedMeeting?.recentBlockers ?? [];
  const recentMemoryMatches = selectedMeeting?.recentMemoryMatches ?? [];
  const recentOpenQuestions = selectedMeeting?.recentOpenQuestions ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_28%),linear-gradient(180deg,#09121b_0%,#0a1521_30%,#f4efe2_30%,#f7f4ec_100%)] text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:px-10 lg:px-12">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 shadow-[0_30px_110px_rgba(2,8,23,0.48)] backdrop-blur">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-100">
                Phase 4 live processing mock
              </p>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Turn capture chunks into transcript, visual evidence, and reasoning signals.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  This slice keeps the real browser capture path and layers in a
                  development-safe processing loop so each chunk now produces mock
                  transcript, visual evidence, decision, blocker, commitment, and
                  memory outputs for the dashboard.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-200 sm:grid-cols-2 lg:min-w-[24rem]">
              <Metric label="Selected track" value="Elastic" />
              <Metric label="API base URL" value={getApiBaseUrl()} />
              <Metric label="Meetings in memory" value={String(meetings.length)} />
              <Metric label="Capture phase" value={capturePhase} />
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
                <SupportBadge label="MediaDevices" ok={captureSupport?.mediaDevices ?? false} />
                <SupportBadge label="getDisplayMedia" ok={captureSupport?.displayCapture ?? false} />
                <SupportBadge label="MediaRecorder" ok={captureSupport?.mediaRecorder ?? false} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                This now feeds directly into the browser capture controls below.
                The UI only enables live capture when the connector and meeting
                lifecycle state both allow it.
              </p>
            </Card>

            <Card title="Capture rollout" eyebrow="Development path">
              <div className="space-y-3">
                {captureStages.map((stage) => (
                  <article
                    key={stage.id}
                    className="rounded-[1.2rem] border border-slate-900/10 bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">{stage.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</p>
                  </article>
                ))}
              </div>
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
                              selectedMeeting?.id === meeting.id ? "text-slate-300" : "text-slate-500"
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
                      <h2 className="text-2xl font-semibold text-white">{selectedMeeting.title}</h2>
                      <p className="text-sm leading-6 text-slate-300">
                        {selectedMeeting.notes || "No operator notes were added for this meeting."}
                      </p>
                    </div>
                    <StatusPill status={selectedMeeting.status} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Participants" value={String(selectedMeeting.participantCount)} />
                    <MetricCard label="Connector" value={selectedMeeting.sourceConnector} />
                    <MetricCard label="Track" value={selectedMeeting.primaryTrack} />
                    <MetricCard label="Capture events" value={String(selectedMeeting.metrics.captureEventsCount)} />
                    <MetricCard label="Capture chunks" value={String(selectedMeeting.metrics.captureChunksCount)} />
                    <MetricCard label="Captured bytes" value={formatBytes(selectedMeeting.metrics.capturedBytes)} />
                    <MetricCard label="Decisions" value={String(selectedMeeting.metrics.decisionsCount)} />
                    <MetricCard label="Commitments" value={String(selectedMeeting.metrics.commitmentsCount)} />
                    <MetricCard label="Blockers" value={String(selectedMeeting.metrics.blockersCount)} />
                    <MetricCard label="Open questions" value={String(selectedMeeting.metrics.openQuestionsCount)} />
                    <MetricCard label="Transcript segments" value={String(selectedMeeting.metrics.transcriptSegmentsCount)} />
                    <MetricCard label="Visual events" value={String(selectedMeeting.metrics.visualEventsCount)} />
                    <MetricCard label="Memory matches" value={String(selectedMeeting.metrics.memoryMatchesCount)} />
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
                      {selectedMeeting.status === "draft" ? "Start meeting" : "Meeting started"}
                    </button>
                    <button
                      className={secondaryDarkButtonClassName}
                      disabled={isBusy || selectedMeeting.status === "ended"}
                      onClick={() => {
                        void handleLifecycleAction("end");
                      }}
                      type="button"
                    >
                      {selectedMeeting.status === "ended" ? "Meeting ended" : "End meeting"}
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

            <Card title="Browser capture session" eyebrow="Chunk registration">
              {selectedMeeting ? (
                <div className="space-y-5">
                  <div className="rounded-[1.25rem] border border-slate-900/10 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {activeCaptureSession
                            ? "Capture session is registered"
                            : "No capture session registered"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {activeCaptureSession
                            ? `Recorder ${formatRecorderMimeType(activeCaptureSession.recorderMimeType)} is ${activeCaptureSession.status}.`
                            : "Start the meeting, then begin browser capture to register a live session and start emitting chunk metadata."}
                        </p>
                      </div>
                      <CaptureStatusPill
                        status={activeCaptureSession?.status ?? "idle"}
                        phase={capturePhase}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className={primaryLightButtonClassName}
                        disabled={!canStartCapture}
                        onClick={() => {
                          void beginBrowserCapture();
                        }}
                        type="button"
                      >
                        {capturePhase === "requesting" ? "Requesting permission..." : "Begin browser capture"}
                      </button>
                      <button
                        className={secondaryLightButtonClassName}
                        disabled={capturePhase !== "recording"}
                        onClick={() => {
                          void stopBrowserCapture();
                        }}
                        type="button"
                      >
                        {capturePhase === "stopping" ? "Stopping..." : "Stop capture"}
                      </button>
                    </div>

                    {activeCaptureSession ? (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoTile label="Chunk count" value={String(activeCaptureSession.chunkCount)} />
                        <InfoTile label="Total bytes" value={formatBytes(activeCaptureSession.totalBytes)} />
                        <InfoTile
                          label="Display audio"
                          value={activeCaptureSession.hasDisplayAudio ? "Yes" : "No"}
                        />
                        <InfoTile
                          label="Microphone"
                          value={activeCaptureSession.hasMicrophoneAudio ? "Yes" : "No"}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {recentChunks.length === 0 ? (
                      <EmptyState
                        title="No capture chunks yet"
                        body="Chunk lifecycle and processing status will appear here as the MediaRecorder emits time-based segments."
                      />
                    ) : (
                      recentChunks.map((chunk) => (
                        <CaptureChunkCard key={chunk.id} chunk={chunk} />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No active capture target"
                  body="Choose a meeting to inspect or begin browser capture."
                />
              )}
            </Card>

            <Card title="Transcript feed" eyebrow="Live processing">
              {selectedMeeting ? (
                <div className="space-y-3">
                  {recentTranscriptSegments.length === 0 ? (
                    <EmptyState
                      title="No transcript segments yet"
                      body="Start browser capture and let a chunk register to see live transcript evidence."
                    />
                  ) : (
                    recentTranscriptSegments.map((segment) => (
                      <TranscriptCard key={segment.id} segment={segment} />
                    ))
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No transcript target"
                  body="Choose a meeting to inspect transcript segments as they arrive."
                />
              )}
            </Card>

            <Card title="Visual evidence" eyebrow="Frame extraction">
              {selectedMeeting ? (
                <div className="space-y-3">
                  {recentScreenEvents.length === 0 ? (
                    <EmptyState
                      title="No visual evidence yet"
                      body="Once chunks are uploaded, extracted frames and screen events will show up here."
                    />
                  ) : (
                    recentScreenEvents.map((screenEvent) => (
                      <ScreenEventCard key={screenEvent.id} screenEvent={screenEvent} />
                    ))
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No visual target"
                  body="Choose a meeting to inspect derived screen evidence."
                />
              )}
            </Card>

            <Card title="Reasoning outputs" eyebrow="Agent-facing signals">
              {selectedMeeting ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <SignalColumn
                    title="Decisions"
                    emptyTitle="No decisions yet"
                    emptyBody="Reasoning decisions will show up after chunk processing runs."
                  >
                    {recentDecisions.map((decision) => (
                      <DecisionCard key={decision.id} decision={decision} />
                    ))}
                  </SignalColumn>

                  <SignalColumn
                    title="Commitments"
                    emptyTitle="No commitments yet"
                    emptyBody="Commitments with owners and due hints will appear here."
                  >
                    {recentCommitments.map((commitment) => (
                      <CommitmentCard key={commitment.id} commitment={commitment} />
                    ))}
                  </SignalColumn>

                  <SignalColumn
                    title="Blockers"
                    emptyTitle="No blockers yet"
                    emptyBody="Blockers will be highlighted once the processing loop detects them."
                  >
                    {recentBlockers.map((blocker) => (
                      <BlockerCard key={blocker.id} blocker={blocker} />
                    ))}
                  </SignalColumn>

                  <SignalColumn
                    title="Memory matches"
                    emptyTitle="No memory matches yet"
                    emptyBody="Elastic-backed historical matches will show here once signals are produced."
                  >
                    {recentMemoryMatches.map((memoryMatch) => (
                      <MemoryMatchCard key={memoryMatch.id} memoryMatch={memoryMatch} />
                    ))}
                  </SignalColumn>

                  <SignalColumn
                    title="Open questions"
                    emptyTitle="No open questions yet"
                    emptyBody="Unresolved questions will appear here for the final report handoff."
                  >
                    {recentOpenQuestions.map((openQuestion) => (
                      <OpenQuestionCard key={openQuestion.id} openQuestion={openQuestion} />
                    ))}
                  </SignalColumn>
                </div>
              ) : (
                <EmptyState
                  title="No reasoning target"
                  body="Choose a meeting to inspect live reasoning outputs."
                />
              )}
            </Card>

            <Card title="Lifecycle timeline" eyebrow="Deterministic plus derived events">
              {selectedMeeting ? (
                <div className="space-y-4">
                  {selectedMeeting.latestEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-[1.25rem] border border-slate-900/10 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
                            {event.kind}
                          </span>
                          <span className="text-xs text-slate-500">{formatTimestamp(event.at)}</span>
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
                    <p className="text-sm font-semibold text-slate-900">{module.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
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
            This slice adds mock chunk processing behind the real browser capture
            path, so transcript segments, visual evidence, and reasoning signals
            now render live. Cloud storage uploads and managed Google Agent Builder
            runtime orchestration are still upcoming.
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
  const variant =
    status === "live"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : status === "ended"
        ? "bg-slate-200 text-slate-700 border-slate-300"
        : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${variant}`}>
      {status}
    </span>
  );
}

function CaptureStatusPill({
  status,
  phase,
}: {
  status: CaptureSessionSummary["status"] | "idle";
  phase: CapturePhase;
}) {
  const label =
    phase === "requesting"
      ? "requesting"
      : phase === "stopping"
        ? "stopping"
        : status;

  const variant =
    label === "recording"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : label === "completed"
        ? "bg-slate-200 text-slate-700 border-slate-300"
        : label === "requesting" || label === "stopping"
          ? "bg-sky-100 text-sky-800 border-sky-200"
          : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${variant}`}>
      {label}
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-900/10 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CaptureChunkCard({ chunk }: { chunk: CaptureChunkSummary }) {
  return (
    <article className="rounded-[1.2rem] border border-slate-900/10 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Chunk {chunk.sequence}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {formatBytes(chunk.byteSize)} captured over {formatDuration(chunk.durationMs)}.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            {chunk.transcriptSegmentCount} transcript segments · {chunk.visualEventCount} visual events · {chunk.signalCount} derived signals
          </p>
          <p className="mt-2 break-all text-xs text-slate-500">
            {chunk.clientChunkId} · {chunk.storageObjectPath}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
            {chunk.lifecycleStatus}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
            upload {chunk.uploadStatus}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
            processing {chunk.processingStatus}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
            {chunk.frameCount} frames
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
            {chunk.mimeType}
          </span>
          <span className="text-xs text-slate-500">{formatTimestamp(chunk.recordedAt)}</span>
        </div>
      </div>
    </article>
  );
}

function TranscriptCard({ segment }: { segment: TranscriptSegment }) {
  return (
    <article className="rounded-[1.2rem] border border-slate-900/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{segment.speakerLabel}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{segment.text}</p>
        </div>
        <span className="whitespace-nowrap text-xs text-slate-500">
          {formatTimestamp(segment.startedAt)}
        </span>
      </div>
    </article>
  );
}

function ScreenEventCard({ screenEvent }: { screenEvent: ScreenEvent }) {
  return (
    <article className="rounded-[1.2rem] border border-slate-900/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{formatScreenEventKind(screenEvent.kind)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{screenEvent.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {formatFrameTimestamp(screenEvent.frameTimestampMs)}
          </p>
          <p className="mt-2 text-xs text-slate-500">{formatTimestamp(screenEvent.recordedAt)}</p>
        </div>
      </div>
    </article>
  );
}

function SignalColumn({
  title,
  emptyTitle,
  emptyBody,
  children,
}: {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <section className="rounded-[1.25rem] border border-slate-900/10 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? items : <EmptyState title={emptyTitle} body={emptyBody} />}
      </div>
    </section>
  );
}

function DecisionCard({ decision }: { decision: DecisionRecord }) {
  return (
    <article className="rounded-[1rem] border border-slate-900/10 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{decision.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{decision.rationale}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        {decision.speakerLabel} · {formatTimestamp(decision.recordedAt)}
      </p>
    </article>
  );
}

function CommitmentCard({ commitment }: { commitment: CommitmentRecord }) {
  return (
    <article className="rounded-[1rem] border border-slate-900/10 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{commitment.ownerLabel}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{commitment.action}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        Due {commitment.dueHint} · {formatTimestamp(commitment.recordedAt)}
      </p>
    </article>
  );
}

function BlockerCard({ blocker }: { blocker: BlockerRecord }) {
  return (
    <article className="rounded-[1rem] border border-slate-900/10 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{blocker.summary}</p>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-amber-800">
          {blocker.severity}
        </span>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        Owner {blocker.ownerLabel} · {formatTimestamp(blocker.recordedAt)}
      </p>
    </article>
  );
}

function MemoryMatchCard({ memoryMatch }: { memoryMatch: MemoryMatch }) {
  return (
    <article className="rounded-[1rem] border border-slate-900/10 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{memoryMatch.summary}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Source meeting: {memoryMatch.sourceMeetingTitle}
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        {memoryMatch.strength} · {formatTimestamp(memoryMatch.recordedAt)}
      </p>
    </article>
  );
}

function OpenQuestionCard({ openQuestion }: { openQuestion: OpenQuestionRecord }) {
  return (
    <article className="rounded-[1rem] border border-slate-900/10 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{openQuestion.question}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        {openQuestion.speakerLabel} · {formatTimestamp(openQuestion.recordedAt)}
      </p>
    </article>
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

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} s`;
}

function formatFrameTimestamp(value: number) {
  return `${(value / 1000).toFixed(1)} s`;
}

function formatBytes(byteSize: number) {
  if (byteSize < 1024) {
    return `${byteSize} B`;
  }
  if (byteSize < 1024 * 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`;
  }
  return `${(byteSize / (1024 * 1024)).toFixed(2)} MB`;
}

function subscribeToBrowserAvailability() {
  return () => {};
}

function toMeetingSummary(meeting: MeetingDetail): MeetingSummary {
  return {
    id: meeting.id,
    title: meeting.title,
    participantCount: meeting.participantCount,
    status: meeting.status,
    sourceConnector: meeting.sourceConnector,
    primaryTrack: meeting.primaryTrack,
    createdAt: meeting.createdAt,
    startedAt: meeting.startedAt,
    endedAt: meeting.endedAt,
    notes: meeting.notes,
    metrics: meeting.metrics,
  };
}

function upsertMeetingSummary(
  meetings: MeetingSummary[],
  candidate: MeetingSummary,
) {
  const next = meetings.filter((meeting) => meeting.id !== candidate.id);
  next.unshift(candidate);
  return next;
}

async function buildCaptureResources(): Promise<CaptureResources> {
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  let microphoneStream: MediaStream | null = null;
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    microphoneStream = null;
  }

  const composedStream = new MediaStream();
  const cleanupCallbacks: Array<() => void> = [];

  const displayVideoTracks = displayStream.getVideoTracks();
  const displayAudioTracks = displayStream.getAudioTracks();
  const microphoneAudioTracks = microphoneStream?.getAudioTracks() ?? [];

  displayVideoTracks.forEach((track) => composedStream.addTrack(track));

  if (displayAudioTracks.length + microphoneAudioTracks.length > 1) {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    const audioStreams: MediaStream[] = [];

    if (displayAudioTracks.length > 0) {
      audioStreams.push(new MediaStream(displayAudioTracks));
    }
    if (microphoneAudioTracks.length > 0) {
      audioStreams.push(new MediaStream(microphoneAudioTracks));
    }

    audioStreams.forEach((stream) => {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(destination);
    });

    destination.stream.getAudioTracks().forEach((track) => composedStream.addTrack(track));

    cleanupCallbacks.push(() => {
      void audioContext.close();
    });
  } else {
    [...displayAudioTracks, ...microphoneAudioTracks].forEach((track) => composedStream.addTrack(track));
  }

  cleanupCallbacks.push(() => {
    displayStream.getTracks().forEach((track) => track.stop());
    microphoneStream?.getTracks().forEach((track) => track.stop());
    composedStream.getTracks().forEach((track) => {
      if (track.readyState === "live") {
        track.stop();
      }
    });
  });

  return {
    stream: composedStream,
    cleanup: () => {
      cleanupCallbacks.forEach((callback) => callback());
    },
    hasDisplayVideo: displayVideoTracks.length > 0,
    hasDisplayAudio: displayAudioTracks.length > 0,
    hasMicrophoneAudio: microphoneAudioTracks.length > 0,
  };
}

function resolveRecorderMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];

  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function buildClientChunkId(captureSessionId: string, sequence: number) {
  return `${captureSessionId}_chunk_${String(sequence).padStart(4, "0")}`;
}

function formatRecorderMimeType(value: string) {
  return value === "browser-default" ? "browser default" : value;
}

function formatScreenEventKind(value: ScreenEvent["kind"]) {
  return value.replaceAll("_", " ");
}

const inputClassName =
  "w-full rounded-[1rem] border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/35";

const primaryButtonClassName =
  "rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60";

const primaryLightButtonClassName =
  "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryDarkButtonClassName =
  "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryLightButtonClassName =
  "rounded-full border border-slate-900/15 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
