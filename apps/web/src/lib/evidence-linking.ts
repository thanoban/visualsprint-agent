import type {
  EvidenceReference,
  ScreenEvent,
  TranscriptSegment,
} from "@visualsprint/contracts";

const DEFAULT_WINDOW_MS = 8_000;

export function toEpochMs(value: string) {
  return new Date(value).getTime();
}

export function transcriptMatchesScreenEvent(
  segment: TranscriptSegment,
  screenEvent: ScreenEvent,
  windowMs = DEFAULT_WINDOW_MS,
) {
  const segmentMs = toEpochMs(segment.startedAt);
  const eventMs = toEpochMs(screenEvent.recordedAt);
  return Math.abs(segmentMs - eventMs) <= windowMs;
}

export function findLinkedScreenEvents(
  segment: TranscriptSegment,
  screenEvents: ScreenEvent[],
  windowMs = DEFAULT_WINDOW_MS,
) {
  return screenEvents.filter((event) => transcriptMatchesScreenEvent(segment, event, windowMs));
}

export function findLinkedTranscriptSegments(
  screenEvent: ScreenEvent,
  segments: TranscriptSegment[],
  windowMs = DEFAULT_WINDOW_MS,
) {
  return segments.filter((segment) => transcriptMatchesScreenEvent(segment, screenEvent, windowMs));
}

export function resolveEvidenceTargets(
  reference: EvidenceReference,
  segments: TranscriptSegment[],
  screenEvents: ScreenEvent[],
) {
  const transcriptId = reference.transcriptRef ?? undefined;
  const frameId = reference.frameRef ?? undefined;

  const linkedTranscripts = transcriptId
    ? segments.filter((segment) => segment.id === transcriptId)
    : segments.filter((segment) =>
        screenEvents.some(
          (event) =>
            event.id === frameId ||
            (reference.tStartMs <= toEpochMs(segment.startedAt) &&
              toEpochMs(segment.startedAt) <= reference.tEndMs),
        ),
      );

  const linkedFrames = frameId
    ? screenEvents.filter((event) => event.id === frameId)
    : screenEvents.filter((event) =>
        linkedTranscripts.some((segment) => transcriptMatchesScreenEvent(segment, event)),
      );

  return {
    transcriptIds: linkedTranscripts.map((segment) => segment.id),
    screenEventIds: linkedFrames.map((event) => event.id),
  };
}
