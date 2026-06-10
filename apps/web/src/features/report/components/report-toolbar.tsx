"use client";

import { Copy, Printer, FileText } from "lucide-react";

import { useToast } from "../../../components/providers/toast-provider";
import { Button } from "../../../components/ui/button";

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
    <div className="sticky top-[57px] z-30 flex flex-col gap-3 rounded-xl border border-border bg-[var(--bg-elevated)]/90 p-3 backdrop-glass print:hidden sm:top-[57px] sm:gap-4 sm:p-4">
      <nav aria-label="Report sections" className="-mx-1 flex gap-2 overflow-x-auto px-1">
        {sections.map((section) => (
          <a
            key={section.id}
            className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition hover:border-brand/40 hover:text-brand hover:shadow-sm"
            href={`#${section.id}`}
          >
            {section.label}
          </a>
        ))}
      </nav>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Copy size={14} strokeWidth={2} />}
          onClick={() => void copySummary()}
        >
          Copy summary
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Printer size={14} strokeWidth={2} />}
          onClick={() => window.print()}
        >
          Print report
        </Button>
      </div>
    </div>
  );
}
