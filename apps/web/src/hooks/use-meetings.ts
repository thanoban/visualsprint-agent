"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getActionRecommendations,
  getAgentInvocationAudit,
  getChunkInsight,
  getFinalReport,
  getIndexedOutcomeDocuments,
  getMeeting,
  getPlatformMeta,
  getSummaryPacket,
  listMeetings,
} from "../lib/api";
import { queryKeys } from "../lib/query-keys";

export function useMeetings() {
  return useQuery({
    queryKey: queryKeys.meetings,
    queryFn: listMeetings,
  });
}

export function useMeeting(meetingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.meeting(meetingId ?? ""),
    queryFn: () => getMeeting(meetingId!),
    enabled: Boolean(meetingId),
  });
}

export function usePlatformMeta() {
  return useQuery({
    queryKey: queryKeys.platformMeta,
    queryFn: getPlatformMeta,
  });
}

export function useAgentAudit() {
  return useQuery({
    queryKey: queryKeys.agentAudit,
    queryFn: getAgentInvocationAudit,
  });
}

export function useFinalReport(meetingId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.finalReport(meetingId ?? ""),
    queryFn: () => getFinalReport(meetingId!),
    enabled: Boolean(meetingId) && enabled,
  });
}

export function useChunkInsight(meetingId: string | undefined, clientChunkId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chunkInsight(meetingId ?? "", clientChunkId ?? ""),
    queryFn: () => getChunkInsight(meetingId!, clientChunkId!),
    enabled: Boolean(meetingId && clientChunkId),
  });
}

export function useSummaryPacket(meetingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.summaryPacket(meetingId ?? ""),
    queryFn: () => getSummaryPacket(meetingId!),
    enabled: Boolean(meetingId),
  });
}

export function useIndexedOutcomes(meetingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.indexedOutcomes(meetingId ?? ""),
    queryFn: () => getIndexedOutcomeDocuments(meetingId!),
    enabled: Boolean(meetingId),
  });
}

export function useActionRecommendations(meetingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.actionRecommendations(meetingId ?? ""),
    queryFn: () => getActionRecommendations(meetingId!),
    enabled: Boolean(meetingId),
  });
}
