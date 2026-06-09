"use client";

import { captureStages } from "@visualsprint/contracts";

import { Card } from "../../../components/ui/card";
import { SupportBadge } from "../../../components/ui/status-pill";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";

export function CaptureReadiness() {
  const { captureSupport } = useMeetingSession();

  return (
    <>
      <Card title="Browser capture readiness" eyebrow="Pre-flight">
        <div className="grid gap-3 sm:grid-cols-3">
          <SupportBadge label="MediaDevices" ok={captureSupport?.mediaDevices ?? false} />
          <SupportBadge label="getDisplayMedia" ok={captureSupport?.displayCapture ?? false} />
          <SupportBadge label="MediaRecorder" ok={captureSupport?.mediaRecorder ?? false} />
        </div>
        <div className="mt-5 space-y-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm leading-7 text-foreground-muted">
          <p className="font-medium text-foreground">Share your meeting tab for the best experience.</p>
          <p>
            For browser-based Meet or Zoom, share the meeting tab directly. For desktop Zoom, share
            the Zoom window. Full-screen capture works as a fallback when window capture is not
            available.
          </p>
        </div>
      </Card>

      <Card title="Capture rollout" eyebrow="Progress path">
        <div className="space-y-3">
          {captureStages.map((stage) => (
            <article key={stage.id} className="rounded-[1.2rem] border border-border bg-surface-muted p-4">
              <p className="text-sm font-semibold text-foreground">{stage.label}</p>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">{stage.description}</p>
            </article>
          ))}
        </div>
      </Card>
    </>
  );
}
