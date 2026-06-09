"use client";

import { useApiHealth } from "../../hooks/use-api-health";
import { getPublicApiBaseUrl } from "../../lib/env";

export function ApiStatusBadge() {
  const health = useApiHealth();

  if (health === "checking") {
    return null;
  }

  const online = health === "online";

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted"
      title={`API ${online ? "connected" : "unreachable"} at ${getPublicApiBaseUrl()}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${online ? "bg-[var(--status-live)]" : "bg-[var(--status-error)]"}`}
      />
      <span className="sr-only">API {online ? "connected" : "unreachable"}</span>
      <span aria-hidden="true">{online ? "API online" : "API offline"}</span>
    </span>
  );
}
