import type { DecisionRecord, ScreenEvent } from "@visualsprint/contracts";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while talking to the VisualSprint API.";
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function formatEvidenceReference(reference: DecisionRecord["evidence"][number]) {
  const rangeLabel = `${formatFrameTimestamp(reference.tStartMs)}-${formatFrameTimestamp(reference.tEndMs)}`;
  const transcriptLabel = reference.transcriptRef
    ? `transcript ${reference.transcriptRef}`
    : "no transcript ref";
  const frameLabel = reference.frameRef ? `frame ${reference.frameRef}` : "no frame ref";
  return `${reference.clientChunkId} · ${rangeLabel} · ${transcriptLabel} · ${frameLabel} · ${reference.note}`;
}

export function formatFrameTimestamp(value: number) {
  return `${(value / 1000).toFixed(1)} s`;
}

export function formatBytes(byteSize: number) {
  if (byteSize < 1024) {
    return `${byteSize} B`;
  }
  if (byteSize < 1024 * 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`;
  }
  return `${(byteSize / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatRecorderMimeType(value: string) {
  return value === "browser-default" ? "browser default" : value;
}

export function formatProcessingSourceMode(value: string) {
  return value === "downstream_service" ? "service" : "local";
}

export function formatInvocationExecutionMode(
  value: "mock" | "bridge" | "bridge_fallback" | "vertex_ai" | "vertex_ai_fallback",
) {
  return value.replaceAll("_", " ");
}

export function formatScreenEventKind(value: ScreenEvent["kind"]) {
  return value.replaceAll("_", " ");
}

export function formatElapsedTime(startedAt: string | null, nowMs: number) {
  if (!startedAt) {
    return "00:00";
  }
  const elapsed = Math.max(0, nowMs - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
