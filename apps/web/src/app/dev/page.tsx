import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MeetingWorkspace } from "../../features/workspace/meeting-workspace";
import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { showDevPanels } from "../../lib/env";

export const metadata: Metadata = {
  title: "Developer tools · VisualSprint",
  description: "Integration diagnostics for platform meta, agent audit, and capture insights.",
};

export default function DevPage() {
  if (!showDevPanels()) {
    redirect("/meetings");
  }

  return (
    <ThemeWrapper theme="ink">
      <MeetingWorkspace view="dev" />
    </ThemeWrapper>
  );
}
