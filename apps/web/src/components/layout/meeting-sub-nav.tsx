"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { suffix: "live", label: "Live" },
  { suffix: "report", label: "Report" },
  { suffix: "actions", label: "Actions" },
];

export function MeetingSubNav({ meetingId }: { meetingId?: string }) {
  const pathname = usePathname();

  if (!meetingId) {
    return null;
  }

  return (
    <nav
      aria-label="Meeting sections"
      className="border-b border-border bg-[var(--bg-elevated)]/80"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 py-2 sm:px-10">
        {sections.map((section) => {
          const href = `/meetings/${meetingId}/${section.suffix}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={section.suffix}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
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
