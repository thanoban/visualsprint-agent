import type { Metadata } from "next";

import { MeetingsListPage } from "../../features/meetings/meetings-list-page";

export const metadata: Metadata = {
  title: "Meetings · VisualSprint",
  description: "Browse live sessions and open evidence-backed meeting reports.",
};

export default function MeetingsPage() {
  return <MeetingsListPage />;
}
