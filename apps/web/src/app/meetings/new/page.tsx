import { MeetingWorkspace } from "../../../features/workspace/meeting-workspace";
import { ThemeWrapper } from "../../../components/layout/theme-wrapper";

export default function NewMeetingPage() {
  return (
    <ThemeWrapper theme="paper">
      <MeetingWorkspace view="setup" />
    </ThemeWrapper>
  );
}
