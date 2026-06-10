import type { Metadata } from "next";

import { LandingPage } from "../features/landing/landing-page";

export const metadata: Metadata = {
  title: "VisualSprint — Meeting intelligence for online engineering teams",
  description:
    "Capture online meeting conversations, screen activity, decisions, and commitments. Turn context into evidence-backed reports and approved Jira/Slack workflow actions.",
};

export default function HomePage() {
  return <LandingPage />;
}
