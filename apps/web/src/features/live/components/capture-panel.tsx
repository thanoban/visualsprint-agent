"use client";

import { useRef } from "react";
import { Play, Square, Radio } from "lucide-react";

import { CaptureChunkCard, CaptureSessionSummary } from "../../../components/domain/capture-cards";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Button } from "../../../components/ui/button";
import { CaptureStatusPill } from "../../../components/ui/status-pill";
import { formatCapturePhase } from "../../../lib/format";
import type { CapturePhase } from "../../meeting-session/types";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";

function captureStatusMessage(phase: CapturePhase) {
  switch (phase) {
    case "requesting":
      return "Requesting screen and microphone access.";
    case "recording":
      return "Capture is recording.";
    case "stopping":
      return "Stopping capture and uploading the final segment.";
    default:
      return "Capture is idle.";
  }
}

export function CapturePanel() {
  const beginButtonRef = useRef<HTMLButtonElement | null>(null);
  const stopButtonRef = useRef<HTMLButtonElement | null>(null);
  const {
    meeting,
    capturePhase,
    canStartCapture,
    beginBrowserCapture,
    stopBrowserCapture,
  } = useMeetingSession();

  if (!meeting) {
    return (
      <Card title="Live capture" eyebrow="Browser session">
        <EmptyState title="No meeting selected" body="Choose a meeting to start capture." />
      </Card>
    );
  }

  const activeCaptureSession = meeting.activeCaptureSession;
  const recentChunks = meeting.recentCaptureChunks;

  const isCaptureBusy = capturePhase === "requesting" || capturePhase === "stopping";

  return (
    <Card title="Live capture" eyebrow="Browser session">
      <div className="space-y-5">
        <p className="sr-only" role="status" aria-live="polite">
          {captureStatusMessage(capturePhase)}
        </p>
        <div
          aria-busy={isCaptureBusy}
          className="rounded-xl border border-border bg-surface-muted p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activeCaptureSession ? "Capture is active" : "Capture not started"}
              </p>
              <CaptureSessionSummary
                hasSession={Boolean(activeCaptureSession)}
                recorderMimeType={activeCaptureSession?.recorderMimeType}
                session={activeCaptureSession}
                status={activeCaptureSession?.status}
              />
            </div>
            <CaptureStatusPill
              phase={capturePhase}
              status={activeCaptureSession?.status ?? "idle"}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {isCaptureBusy ? (
              <p className="w-full text-sm text-foreground-muted">
                {formatCapturePhase(capturePhase)}
              </p>
            ) : null}
            <Button
              ref={beginButtonRef}
              leftIcon={<Play size={16} strokeWidth={2.5} />}
              disabled={!canStartCapture || isCaptureBusy}
              onClick={() => {
                void beginBrowserCapture();
                stopButtonRef.current?.focus();
              }}
            >
              Begin capture
            </Button>
            <Button
              ref={stopButtonRef}
              variant="secondary"
              leftIcon={<Square size={16} strokeWidth={2.5} />}
              disabled={capturePhase !== "recording" || isCaptureBusy}
              onClick={() => {
                void stopBrowserCapture();
                beginButtonRef.current?.focus();
              }}
            >
              Stop capture
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {recentChunks.length === 0 ? (
            <EmptyState
              title="No segments yet"
              body="Capture segments appear here every few seconds during recording."
            />
          ) : (
            recentChunks.map((chunk) => <CaptureChunkCard key={chunk.id} chunk={chunk} />)
          )}
        </div>
      </div>
    </Card>
  );
}
