import { MeetingWorkspace } from "../../../../features/workspace/meeting-workspace";
import { ThemeWrapper } from "../../../../components/layout/theme-wrapper";

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
