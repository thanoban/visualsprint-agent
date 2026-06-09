"use client";

import type { MeetingDetail } from "@visualsprint/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getMeetingEventsUrl } from "../lib/api";
import { queryKeys } from "../lib/query-keys";
import { toMeetingSummary, upsertMeetingSummary } from "../lib/meeting";

export type StreamStatus = "idle" | "connecting" | "live" | "reconnecting";

export function useMeetingStream(meetingId: string | undefined) {
  const queryClient = useQueryClient();
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");

  useEffect(() => {
    if (!meetingId || typeof EventSource === "undefined") {
      setStreamStatus("idle");
      return;
    }

    setStreamStatus("connecting");
    const eventSource = new EventSource(getMeetingEventsUrl(meetingId));

    const handleMeetingUpdated = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as { meeting: MeetingDetail };
      queryClient.setQueryData(queryKeys.meeting(meetingId), { meeting: payload.meeting });
      queryClient.setQueryData(queryKeys.meetings, (current: { meetings: ReturnType<typeof toMeetingSummary>[] } | undefined) => {
        if (!current) {
          return current;
        }
        const summary = toMeetingSummary(payload.meeting);
        return { meetings: upsertMeetingSummary(current.meetings, summary) };
      });
      setStreamStatus("live");
    };

    eventSource.onopen = () => {
      setStreamStatus("live");
    };
    eventSource.addEventListener("meeting.updated", handleMeetingUpdated as EventListener);
    eventSource.onerror = () => {
      setStreamStatus("reconnecting");
    };

    return () => {
      eventSource.removeEventListener("meeting.updated", handleMeetingUpdated as EventListener);
      eventSource.close();
      setStreamStatus("idle");
    };
  }, [meetingId, queryClient]);

  return streamStatus;
}
