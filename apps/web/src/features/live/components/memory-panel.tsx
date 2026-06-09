"use client";

import { dashboardModules } from "@visualsprint/contracts";

import { Card } from "../../../components/ui/card";
import { useMeetingSession } from "../../meeting-session/context/meeting-session-provider";
import { MemoryStrip } from "./memory-strip";

export function MemoryPanel() {
  const { meeting } = useMeetingSession();
  if (!meeting) {
    return null;
  }

  const memoryModule = dashboardModules.find((module) => module.id === "memory");

  return (
    <Card
      title={memoryModule?.label ?? "Cross-meeting memory"}
      eyebrow="Elastic memory strip"
    >
      <MemoryStrip matches={meeting.recentMemoryMatches} />
    </Card>
  );
}
