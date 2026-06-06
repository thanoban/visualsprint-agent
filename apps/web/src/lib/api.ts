import type {
  CreateMeetingRequest,
  CreateMeetingResponse,
  MeetingDetailResponse,
  MeetingListResponse,
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
