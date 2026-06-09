"use client";

import { CaptureChunkCard, CaptureSessionSummary } from "../../../components/domain/capture-cards";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import {
  primaryLightButtonClassName,
  secondaryLightButtonClassName,
} from "../../../components/ui/button-styles";
import { CaptureStatusPill } from "../../../components/ui/status-pill";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";

export function CapturePanel() {
  const {
    meeting,
    capturePhase,
    canStartCapture,
    beginBrowserCapture,
    stopBrowserCapture,
  } = useMeetingSession();

  if (!meeting) {
    return (
      <Card title="Browser capture" eyebrow="Chunk registration">
        <EmptyState title="No meeting selected" body="Select a meeting to begin capture." />
      </Card>
    );
  }

  const activeCaptureSession = meeting.activeCaptureSession;
  const recentChunks = meeting.recentCaptureChunks;

  return (
    <Card title="Browser capture" eyebrow="Chunk registration">
      <div className="space-y-5">
        <div className="rounded-[1.25rem] border border-border bg-surface-muted p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activeCaptureSession ? "Capture session active" : "No capture session"}
              </p>
              <CaptureSessionSummary
                hasSession={Boolean(activeCaptureSession)}
                recorderMimeType={activeCaptureSession?.recorderMimeType}
                status={activeCaptureSession?.status}
              />
            </div>
            <CaptureStatusPill
              phase={capturePhase}
              status={activeCaptureSession?.status ?? "idle"}
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
              Begin capture
            </button>
            <button
              className={secondaryLightButtonClassName}
              disabled={capturePhase !== "recording"}
              onClick={() => {
                void stopBrowserCapture();
              }}
              type="button"
            >
              Stop capture
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {recentChunks.length === 0 ? (
            <EmptyState
              title="No chunks yet"
              body="Chunks appear here as the MediaRecorder emits time-based segments."
            />
          ) : (
            recentChunks.map((chunk) => <CaptureChunkCard key={chunk.id} chunk={chunk} />)
          )}
        </div>
      </div>
    </Card>
  );
}
