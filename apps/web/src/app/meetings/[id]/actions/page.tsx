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
    "Actions",
    "Review, approve, and execute recommended follow-up actions.",
  );
}

export default async function ActionsMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ThemeWrapper theme="paper">
      <MeetingWorkspace meetingId={id} view="actions" />
    </ThemeWrapper>
  );
}
