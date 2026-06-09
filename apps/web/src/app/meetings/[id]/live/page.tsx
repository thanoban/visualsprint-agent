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
    "Live session",
    "Real-time meeting capture, evidence linking, and intelligence signals.",
  );
}

export default async function LiveMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ThemeWrapper theme="ink">
      <MeetingWorkspace meetingId={id} view="live" />
    </ThemeWrapper>
  );
}
