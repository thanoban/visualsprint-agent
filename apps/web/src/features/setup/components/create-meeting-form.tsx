"use client";

import { sourceConnectors } from "@visualsprint/contracts";
import type { CreateMeetingRequest } from "@visualsprint/contracts";
import { useRouter } from "next/navigation";

import { Card } from "../../../components/ui/card";
import { Field } from "../../../components/ui/field";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../../../components/ui/button-styles";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";
import { meetingRouteForStatus } from "../../../lib/meeting";

export function CreateMeetingForm() {
  const router = useRouter();
  const { draft, setDraft, isBusy, createMeetingFromDraft, startMeetingSession, meeting } =
    useMeetingSession();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await createMeetingFromDraft(event);
    if (created) {
      router.push(meetingRouteForStatus(created));
    }
  }

  return (
    <Card title="Create meeting" eyebrow="Setup">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="Meeting title">
          <input
            aria-label="Meeting title"
            className={inputClassName}
            placeholder="Weekly product sync"
            value={draft.title}
            onChange={(event) =>
              setDraft((current: CreateMeetingRequest) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Participant count">
            <input
              aria-label="Participant count"
              className={inputClassName}
              min={1}
              max={50}
              placeholder="4"
              type="number"
              value={draft.participantCount}
              onChange={(event) =>
                setDraft((current: CreateMeetingRequest) => ({
                  ...current,
                  participantCount: Number(event.target.value) || 1,
                }))
              }
            />
          </Field>

          <Field label="Primary connector">
            <select
              aria-label="Primary connector"
              className={inputClassName}
              title="Primary connector"
              value={draft.sourceConnector}
              onChange={(event) =>
                setDraft((current: CreateMeetingRequest) => ({
                  ...current,
                  sourceConnector: event.target.value as CreateMeetingRequest["sourceConnector"],
                }))
              }
            >
              {sourceConnectors.map((connector) => (
                <option
                  key={connector.slug}
                  disabled={connector.slug !== "browser_live_capture"}
                  value={connector.slug}
                >
                  {connector.label}
                  {connector.slug !== "browser_live_capture" ? " (planned)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Meeting notes">
          <textarea
            aria-label="Meeting notes"
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="Context, goals, and decisions to capture"
            value={draft.notes}
            onChange={(event) =>
              setDraft((current: CreateMeetingRequest) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </Field>

        <div className="flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={isBusy} type="submit">
            {isBusy ? "Creating…" : "Create meeting"}
          </button>
          {meeting?.status === "draft" ? (
            <button
              className={secondaryButtonClassName}
              disabled={isBusy}
              onClick={() => {
                void startMeetingSession().then((didStart) => {
                  if (didStart) {
                    router.push(`/meetings/${meeting.id}/live`);
                  }
                });
              }}
              type="button"
            >
              Start meeting
            </button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
