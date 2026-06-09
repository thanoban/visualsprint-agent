"use client";

import type { PlatformMetaResponse } from "@visualsprint/contracts";

import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { InfoTile } from "../../components/ui/metric";
import {
  primaryButtonClassName,
  secondaryLightButtonClassName,
} from "../../components/ui/button-styles";
import { ErrorBanner } from "../../components/shared/error-banner";
import { formatInvocationExecutionMode } from "../../lib/format";
import { getApiBaseUrl } from "../../lib/api";
import { useMeetingSession } from "../meeting-session/context/meeting-session-provider";

function DownstreamServiceCard({
  service,
}: {
  service: PlatformMetaResponse["downstreamServices"][number];
}) {
  return (
    <article className="rounded-[1.2rem] border border-border bg-surface-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{service.service}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-foreground-muted">
            {service.kind} · {service.mode}
          </p>
        </div>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium uppercase text-foreground-muted">
          {service.status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">{service.note}</p>
    </article>
  );
}

export function DevPanelsPage() {
  const {
    meeting,
    platformMeta,
    agentInvocationAudit,
    agentSmokeResult,
    isBusy,
    error,
    runAgentSmokeCheck,
    selectMeeting,
    meetings,
  } = useMeetingSession();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">Developer</p>
        <h1 className="text-4xl font-semibold tracking-tight">Integration tools</h1>
        <p className="text-sm text-foreground-muted">API base: {getApiBaseUrl()}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Platform topology" eyebrow="Service boundaries">
          {platformMeta ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile label="Memory layer" value={platformMeta.memoryIntegration.provider} />
                <InfoTile
                  label="Outcome index"
                  value={platformMeta.memoryIntegration.outcomesIndex ?? "not set"}
                />
              </div>
              {platformMeta.downstreamServices.map((service) => (
                <DownstreamServiceCard key={service.kind} service={service} />
              ))}
            </div>
          ) : (
            <EmptyState title="No platform meta" body="Platform metadata has not loaded yet." />
          )}
        </Card>

        <Card title="Agent smoke check" eyebrow="Adapter runtime">
          <div className="space-y-4">
            <button
              className={primaryButtonClassName}
              disabled={isBusy || !meeting}
              onClick={() => {
                void runAgentSmokeCheck();
              }}
              type="button"
            >
              Run agent smoke
            </button>
            {agentSmokeResult ? (
              <p className="text-sm text-foreground-muted">
                {agentSmokeResult.reasoning.note} · {agentSmokeResult.summary.note}
              </p>
            ) : (
              <EmptyState title="No smoke run yet" body="Run smoke to test the agents seam." />
            )}
          </div>
        </Card>
      </div>

      <Card title="Agent invocation audit" eyebrow="Recent runs">
        {agentInvocationAudit?.summary.available ? (
          <div className="space-y-3">
            {agentInvocationAudit.invocations.slice(0, 8).map((invocation) => (
              <article
                key={`${invocation.agentKind}-${invocation.requestKey}-${invocation.invokedAt}`}
                className="rounded-[1.2rem] border border-border bg-surface-muted p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {invocation.agentKind} · {formatInvocationExecutionMode(invocation.executionMode)}
                </p>
                <p className="mt-2 text-sm text-foreground-muted">{invocation.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Audit unavailable" body="Adapter audit proxy is not reachable." />
        )}
      </Card>

      <Card title="Meeting selector" eyebrow="Debug">
        <div className="flex flex-wrap gap-2">
          {meetings.map((item) => (
            <button
              key={item.id}
              className={secondaryLightButtonClassName}
              onClick={() => {
                void selectMeeting(item.id);
              }}
              type="button"
            >
              {item.title}
            </button>
          ))}
        </div>
      </Card>

      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}
