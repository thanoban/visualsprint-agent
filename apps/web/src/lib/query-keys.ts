export const queryKeys = {
  meetings: ["meetings"] as const,
  meeting: (meetingId: string) => ["meetings", meetingId] as const,
  platformMeta: ["platform-meta"] as const,
  agentAudit: ["agent-audit"] as const,
  finalReport: (meetingId: string) => ["meetings", meetingId, "final-report"] as const,
  chunkInsight: (meetingId: string, clientChunkId: string) =>
    ["meetings", meetingId, "chunk-insight", clientChunkId] as const,
  summaryPacket: (meetingId: string) => ["meetings", meetingId, "summary-packet"] as const,
  indexedOutcomes: (meetingId: string) => ["meetings", meetingId, "indexed-outcomes"] as const,
  actionRecommendations: (meetingId: string) =>
    ["meetings", meetingId, "action-recommendations"] as const,
};
