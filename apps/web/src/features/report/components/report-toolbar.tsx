"use client";

import { secondaryButtonClassName } from "../../../components/ui/button-styles";

const sections = [
  { id: "report-summary", label: "Executive summary" },
  { id: "report-decisions", label: "Decisions" },
  { id: "report-questions", label: "Open questions" },
  { id: "report-commitments", label: "Commitments" },
  { id: "report-blockers", label: "Blockers" },
  { id: "report-memory", label: "Memory highlights" },
];

export function ReportToolbar({
  executiveSummary,
}: {
  executiveSummary: string;
}) {
  async function copySummary() {
    try {
      await navigator.clipboard.writeText(executiveSummary);
    } catch {
      // Clipboard may be unavailable in non-secure contexts.
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-surface p-5 print:hidden sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Report sections" className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <a
            key={section.id}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition hover:border-brand/40 hover:text-brand"
            href={`#${section.id}`}
          >
            {section.label}
          </a>
        ))}
      </nav>
      <div className="flex flex-wrap gap-2">
        <button className={secondaryButtonClassName} onClick={() => void copySummary()} type="button">
          Copy summary
        </button>
        <button className={secondaryButtonClassName} onClick={() => window.print()} type="button">
          Print report
        </button>
      </div>
    </div>
  );
}
