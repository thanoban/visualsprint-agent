import { MeetingWorkspace } from "../../../../features/workspace/meeting-workspace";
import { ThemeWrapper } from "../../../../components/layout/theme-wrapper";

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
