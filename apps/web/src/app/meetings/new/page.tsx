import type { Metadata } from "next";

import { ThemeWrapper } from "../../../components/layout/theme-wrapper";
import { MeetingWorkspace } from "../../../features/workspace/meeting-workspace";

export const metadata: Metadata = {
  title: "New meeting · VisualSprint",
  description: "Create a meeting and verify browser capture readiness.",
};

export default function NewMeetingPage() {
  return (
    <ThemeWrapper theme="paper">
      <MeetingWorkspace view="setup" />
    </ThemeWrapper>
  );
}
