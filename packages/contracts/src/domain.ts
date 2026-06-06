export type PartnerTrackSlug =
  | "arize"
  | "elastic"
  | "fivetran"
  | "gitlab"
  | "mongodb"
  | "dynatrace";

export type PlatformCapabilityType = "deterministic" | "intelligence" | "platform";
export type MeetingStatus = "draft" | "live" | "ended";
export type SourceConnectorSlug =
  | "browser_live_capture"
  | "recording_upload"
  | "document_link";
export type LiveEventKind =
  | "system"
  | "capture"
  | "transcript"
  | "decision"
  | "commitment"
  | "blocker"
  | "memory";

export interface PartnerTrack {
  slug: PartnerTrackSlug;
  label: string;
}

export interface PlatformCapability {
  id: string;
  label: string;
  description: string;
  type: PlatformCapabilityType;
}

export interface DashboardModule {
  id: string;
  label: string;
  description: string;
}

export interface FoundationalService {
  name: string;
  responsibility: string;
}

export interface MeetingMetrics {
  decisionsCount: number;
  commitmentsCount: number;
  blockersCount: number;
  memoryMatchesCount: number;
  transcriptSegmentsCount: number;
  captureEventsCount: number;
}

export interface MeetingSummary {
  id: string;
  title: string;
  participantCount: number;
  status: MeetingStatus;
  sourceConnector: SourceConnectorSlug;
  primaryTrack: PartnerTrackSlug;
  createdAt: string;
  startedAt: null | string;
  endedAt: null | string;
  notes: string;
  metrics: MeetingMetrics;
}

export interface LiveEvent {
  id: string;
  kind: LiveEventKind;
  at: string;
  title: string;
  detail: string;
}

export interface MeetingDetail extends MeetingSummary {
  latestEvents: LiveEvent[];
}

export interface CreateMeetingRequest {
  title: string;
  participantCount: number;
  sourceConnector: SourceConnectorSlug;
  notes: string;
}

export interface CreateMeetingResponse {
  meeting: MeetingDetail;
}

export interface MeetingListResponse {
  meetings: MeetingSummary[];
}

export interface MeetingDetailResponse {
  meeting: MeetingDetail;
}

export interface ServiceHealth {
  service: string;
  status: "ok";
  version: string;
  track: PartnerTrackSlug;
}

export const partnerTracks: PartnerTrack[] = [
  { slug: "arize", label: "Arize" },
  { slug: "elastic", label: "Elastic" },
  { slug: "fivetran", label: "Fivetran" },
  { slug: "gitlab", label: "GitLab" },
  { slug: "mongodb", label: "MongoDB" },
  { slug: "dynatrace", label: "Dynatrace" },
];

export const dashboardModules: DashboardModule[] = [
  {
    id: "decisions",
    label: "Decisions with evidence",
    description:
      "Capture the exact conclusion, why it was reached, and which meeting evidence supports it.",
  },
  {
    id: "commitments",
    label: "Commitments and owners",
    description:
      "Assign follow-up work to people and show unresolved promises from prior meetings.",
  },
  {
    id: "blockers",
    label: "Recurring blockers",
    description:
      "Highlight the same problem surfacing across meetings instead of leaving it buried in transcripts.",
  },
  {
    id: "memory",
    label: "Cross-meeting memory",
    description:
      "Use Elastic-backed retrieval to connect new discussion points to organizational history.",
  },
];

export const platformCapabilities: PlatformCapability[] = [
  {
    id: "capture",
    label: "Deterministic capture pipeline",
    description:
      "Signed uploads, chunk lifecycle state, and retry-safe media handling stay in conventional services.",
    type: "deterministic",
  },
  {
    id: "reasoning",
    label: "Managed agent orchestration",
    description:
      "Google Agent Builder remains the orchestration surface for meeting reasoning, memory, and summarization.",
    type: "intelligence",
  },
  {
    id: "contracts",
    label: "Shared domain contracts",
    description:
      "The repo uses common product vocabulary for partner tracks, dashboard surfaces, and service metadata.",
    type: "platform",
  },
  {
    id: "tenancy",
    label: "Future-proof tenancy boundaries",
    description:
      "Tenant-aware data boundaries are part of the architecture even before multi-organization features ship.",
    type: "platform",
  },
];

export const foundationalServices: FoundationalService[] = [
  {
    name: "Web shell",
    responsibility:
      "Hosts the product dashboard, meeting setup flow, and hackathon-aligned platform narrative.",
  },
  {
    name: "API control plane",
    responsibility:
      "Publishes service health, architecture metadata, and the deterministic foundation for later meeting workflows.",
  },
  {
    name: "Contracts package",
    responsibility:
      "Centralizes the language shared by the UI, APIs, and future services before implementation branches out.",
  },
];

export const sourceConnectors: Array<{
  slug: SourceConnectorSlug;
  label: string;
  description: string;
}> = [
  {
    slug: "browser_live_capture",
    label: "Browser live capture",
    description:
      "The first production connector for screen share, microphone, and live meeting session intake.",
  },
  {
    slug: "recording_upload",
    label: "Recording upload",
    description:
      "Future connector for recorded meeting files that should reuse the same downstream pipeline.",
  },
  {
    slug: "document_link",
    label: "Document link",
    description:
      "Future connector for linked docs and structured context that enriches the meeting memory layer.",
  },
];
