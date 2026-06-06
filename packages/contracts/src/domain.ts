export type PartnerTrackSlug =
  | "arize"
  | "elastic"
  | "fivetran"
  | "gitlab"
  | "mongodb"
  | "dynatrace";

export type PlatformCapabilityType = "deterministic" | "intelligence" | "platform";

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
