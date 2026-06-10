"use client";

import { Radio, AlertTriangle } from "lucide-react";

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
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted"
      title={`API ${online ? "connected" : "unreachable"} at ${getPublicApiBaseUrl()}`}
    >
      {online ? (
        <Radio size={12} strokeWidth={2.5} className="text-[var(--status-live)] live-pulse" />
      ) : (
        <AlertTriangle size={12} strokeWidth={2.5} className="text-[var(--status-error)]" />
      )}
      <span className="sr-only">API {online ? "connected" : "unreachable"}</span>
      <span aria-hidden="true" className="hidden sm:inline">{online ? "API online" : "API offline"}</span>
    </span>
  );
}
