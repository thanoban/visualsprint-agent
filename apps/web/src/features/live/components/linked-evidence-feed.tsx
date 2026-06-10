"use client";

import type { ScreenEvent, TranscriptSegment } from "@visualsprint/contracts";
import { useMemo, useState } from "react";

import { ScreenEventCard, TranscriptCard } from "../../../components/domain/record-cards";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import {
  findLinkedScreenEvents,
  findLinkedTranscriptSegments,
} from "../../../lib/evidence-linking";

function highlightClass(active: boolean) {
  return active
    ? "ring-2 ring-accent/60 ring-offset-2 ring-offset-background"
    : "hover:border-brand/30";
}

export function LinkedEvidenceFeed({
  segments,
  screenEvents,
  highlightedTranscriptIds,
  highlightedScreenEventIds,
  onTranscriptSelect,
  onScreenEventSelect,
}: {
  segments: TranscriptSegment[];
  screenEvents: ScreenEvent[];
  highlightedTranscriptIds?: string[];
  highlightedScreenEventIds?: string[];
  onTranscriptSelect?: (segment: TranscriptSegment) => void;
  onScreenEventSelect?: (screenEvent: ScreenEvent) => void;
}) {
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedScreenEventId, setSelectedScreenEventId] = useState<string | null>(null);

  const linkedScreenIds = useMemo(() => {
    if (!selectedTranscriptId) {
      return new Set<string>();
    }
    const segment = segments.find((item) => item.id === selectedTranscriptId);
    if (!segment) {
      return new Set<string>();
    }
    return new Set(findLinkedScreenEvents(segment, screenEvents).map((event) => event.id));
  }, [segments, screenEvents, selectedTranscriptId]);

  const linkedTranscriptIds = useMemo(() => {
    if (!selectedScreenEventId) {
      return new Set<string>();
    }
    const screenEvent = screenEvents.find((item) => item.id === selectedScreenEventId);
    if (!screenEvent) {
      return new Set<string>();
    }
    return new Set(findLinkedTranscriptSegments(screenEvent, segments).map((segment) => segment.id));
  }, [segments, screenEvents, selectedScreenEventId]);

  const externalTranscriptHighlights = new Set(highlightedTranscriptIds ?? []);
  const externalScreenHighlights = new Set(highlightedScreenEventIds ?? []);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Transcript feed" eyebrow="Conversation">
        <p className="mb-4 text-xs text-foreground-muted">
          Select a segment to highlight matching visual moments.
        </p>
        <div className="space-y-3">
          {segments.length === 0 ? (
            <EmptyState
              title="No transcript yet"
              body="Transcript lines appear as the meeting is processed."
            />
          ) : (
            segments.map((segment) => {
              const isSelected = selectedTranscriptId === segment.id;
              const isLinked = linkedTranscriptIds.has(segment.id);
              const isExternal = externalTranscriptHighlights.has(segment.id);
              const active = isSelected || isLinked || isExternal;

              return (
                <button
                  key={segment.id}
                  className={`block w-full rounded-xl text-left transition ${highlightClass(active)}`}
                  onClick={() => {
                    setSelectedTranscriptId(segment.id);
                    setSelectedScreenEventId(null);
                    onTranscriptSelect?.(segment);
                  }}
                  type="button"
                >
                  <TranscriptCard segment={segment} />
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card title="Visual evidence" eyebrow="Screen context">
        <p className="mb-4 text-xs text-foreground-muted">
          Select a frame event to jump to related transcript lines.
        </p>
        <div className="space-y-3">
          {screenEvents.length === 0 ? (
            <EmptyState
              title="No visual evidence yet"
              body="Screen moments appear as recording segments are analyzed."
            />
          ) : (
            screenEvents.map((screenEvent) => {
              const isSelected = selectedScreenEventId === screenEvent.id;
              const isLinked = linkedScreenIds.has(screenEvent.id);
              const isExternal = externalScreenHighlights.has(screenEvent.id);
              const active = isSelected || isLinked || isExternal;

              return (
                <button
                  key={screenEvent.id}
                  className={`block w-full rounded-xl text-left transition ${highlightClass(active)}`}
                  onClick={() => {
                    setSelectedScreenEventId(screenEvent.id);
                    setSelectedTranscriptId(null);
                    onScreenEventSelect?.(screenEvent);
                  }}
                  type="button"
                >
                  <ScreenEventCard screenEvent={screenEvent} />
                </button>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
