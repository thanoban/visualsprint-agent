import type {
  ChunkInsightResponse,
  CompleteCaptureChunkUploadRequest,
  CompleteCaptureChunkUploadResponse,
  CaptureSessionResponse,
  CreateMeetingRequest,
  CreateMeetingResponse,
  FinalReportResponse,
  IndexedOutcomeDocumentsResponse,
  MeetingSummaryPacketResponse,
  MeetingStreamEvent,
  MeetingDetailResponse,
  MeetingListResponse,
  RegisterAgentOutputsRequest,
  RegisterAgentOutputsResponse,
  RegisterCaptureChunkRequest,
  RegisterCaptureChunkResponse,
  StartCaptureSessionRequest,
} from "@visualsprint/contracts";

const defaultApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${defaultApiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl() {
  return defaultApiBaseUrl;
}

export function getMeetingEventsUrl(meetingId: string) {
  return `${defaultApiBaseUrl}/api/meetings/${meetingId}/events`;
}

export function listMeetings() {
  return request<MeetingListResponse>("/api/meetings");
}

export function getMeeting(meetingId: string) {
  return request<MeetingDetailResponse>(`/api/meetings/${meetingId}`);
}

export function createMeeting(payload: CreateMeetingRequest) {
  return request<CreateMeetingResponse>("/api/meetings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startMeeting(meetingId: string) {
  return request<MeetingDetailResponse>(`/api/meetings/${meetingId}/start`, {
    method: "POST",
  });
}

export function endMeeting(meetingId: string) {
  return request<MeetingDetailResponse>(`/api/meetings/${meetingId}/end`, {
    method: "POST",
  });
}

export function getFinalReport(meetingId: string) {
  return request<FinalReportResponse>(`/api/meetings/${meetingId}/final-report`);
}

export function getChunkInsight(meetingId: string, clientChunkId: string) {
  return request<ChunkInsightResponse>(
    `/api/meetings/${meetingId}/insights/chunks/${clientChunkId}`,
  );
}

export function getSummaryPacket(meetingId: string) {
  return request<MeetingSummaryPacketResponse>(`/api/meetings/${meetingId}/summary-packet`);
}

export function getIndexedOutcomeDocuments(meetingId: string) {
  return request<IndexedOutcomeDocumentsResponse>(
    `/api/meetings/${meetingId}/memory/index-documents`,
  );
}

export function finalizeReport(meetingId: string) {
  return request<FinalReportResponse>(`/api/meetings/${meetingId}/final-report`, {
    method: "POST",
  });
}

export function registerAgentOutputs(
  meetingId: string,
  payload: RegisterAgentOutputsRequest,
) {
  return request<RegisterAgentOutputsResponse>(`/api/meetings/${meetingId}/outputs/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startCaptureSession(
  meetingId: string,
  payload: StartCaptureSessionRequest,
) {
  return request<CaptureSessionResponse>(
    `/api/meetings/${meetingId}/capture-sessions/start`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function registerCaptureChunk(
  meetingId: string,
  payload: RegisterCaptureChunkRequest,
) {
  return request<RegisterCaptureChunkResponse>(
    `/api/meetings/${meetingId}/capture-sessions/chunk`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function completeCaptureChunkUpload(
  meetingId: string,
  payload: CompleteCaptureChunkUploadRequest,
) {
  return request<CompleteCaptureChunkUploadResponse>(
    `/api/meetings/${meetingId}/capture-sessions/chunk/upload-complete`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function completeCaptureSession(meetingId: string) {
  return request<CaptureSessionResponse>(
    `/api/meetings/${meetingId}/capture-sessions/complete`,
    {
      method: "POST",
    },
  );
}

export type { MeetingStreamEvent };
