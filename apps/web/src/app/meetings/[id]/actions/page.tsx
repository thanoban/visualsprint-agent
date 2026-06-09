import { MeetingWorkspace } from "../../../../features/workspace/meeting-workspace";
import { ThemeWrapper } from "../../../../components/layout/theme-wrapper";

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
