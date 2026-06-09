"use client";

import { useToast } from "../../../components/providers/toast-provider";
import { secondaryButtonClassName } from "../../../components/ui/button-styles";

const sections = [
  { id: "report-summary", label: "Executive summary" },
  { id: "report-evidence", label: "Evidence" },
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
  const { pushToast } = useToast();

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(executiveSummary);
      pushToast("Executive summary copied.", "success");
    } catch {
      pushToast("Could not copy summary in this browser.", "error");
    }
  }

  return (
    <div className="sticky top-[120px] z-30 flex flex-col gap-3 rounded-[1.25rem] border border-border bg-surface/95 p-3 backdrop-blur print:hidden sm:top-[124px] sm:gap-4 sm:rounded-[2rem] sm:p-5">
      <nav aria-label="Report sections" className="-mx-1 flex gap-2 overflow-x-auto px-1">
        {sections.map((section) => (
          <a
            key={section.id}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition hover:border-brand/40 hover:text-brand"
            href={`#${section.id}`}
          >
            {section.label}
          </a>
        ))}
      </nav>
      <div className="flex flex-wrap gap-2 sm:justify-end">
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
