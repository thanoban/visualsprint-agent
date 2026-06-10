"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMeetingSession } from "../../features/meeting-session/context/meeting-session-provider";

const sections = [
  { suffix: "live", label: "Live", liveOnly: true },
  { suffix: "report", label: "Report", liveOnly: false },
  { suffix: "actions", label: "Actions", liveOnly: false },
] as const;

export function MeetingSubNav({ meetingId }: { meetingId?: string }) {
  const pathname = usePathname();
  const { meeting } = useMeetingSession();

  if (!meetingId) {
    return null;
  }

  const isLive = meeting?.status === "live";
  const visibleSections = sections.filter((section) => isLive || !section.liveOnly);

  return (
    <nav
      aria-label="Meeting sections"
      className="border-b border-border bg-[var(--bg-elevated)]/80"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-8 lg:px-10">
        {visibleSections.map((section) => {
          const href = `/meetings/${meetingId}/${section.suffix}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={section.suffix}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand/15 text-brand"
                  : "text-foreground-muted hover:text-foreground"
              }`}
              href={href}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
