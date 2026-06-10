import type { Metadata } from "next";

import { ThemeWrapper } from "../../../../components/layout/theme-wrapper";
import { MeetingWorkspace } from "../../../../features/workspace/meeting-workspace";
import { meetingMetadata } from "../../../../lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return meetingMetadata(
    id,
    "Report",
    "Final report with decisions, commitments, blockers, and evidence.",
  );
}

export default async function ReportMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ThemeWrapper theme="paper">
      <MeetingWorkspace meetingId={id} view="report" />
    </ThemeWrapper>
  );
}
