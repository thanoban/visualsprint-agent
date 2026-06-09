import type { Metadata } from "next";

import { LandingPage } from "../features/landing/landing-page";

export const metadata: Metadata = {
  title: "VisualSprint — Meeting intelligence for engineering teams",
  description:
    "Capture live meetings, link evidence, and deliver polished reports with decisions, commitments, and organizational memory.",
};

export default function HomePage() {
  return <LandingPage />;
}
