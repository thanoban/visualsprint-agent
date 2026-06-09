"use client";

import { Card } from "../../../components/ui/card";
import { SupportBadge } from "../../../components/ui/status-pill";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";

export function CaptureReadiness() {
  const { captureSupport } = useMeetingSession();

  return (
    <Card title="Browser capture readiness" eyebrow="Pre-flight">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SupportBadge label="Microphone API" ok={captureSupport?.mediaDevices ?? false} />
        <SupportBadge label="Screen share" ok={captureSupport?.displayCapture ?? false} />
        <SupportBadge label="Recording" ok={captureSupport?.mediaRecorder ?? false} />
        <SupportBadge
          label="System audio"
          ok={captureSupport?.displayCapture ?? false}
        />
      </div>
      <div className="mt-5 space-y-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm leading-6 text-foreground-muted sm:leading-7">
        <p className="font-medium text-foreground">Share your meeting tab for the best experience.</p>
        <p>
          For browser-based Meet or Zoom, share the meeting tab directly. For desktop Zoom, share
          the Zoom window. Full-screen capture works as a fallback when window capture is not
          available.
        </p>
      </div>
    </Card>
  );
}
