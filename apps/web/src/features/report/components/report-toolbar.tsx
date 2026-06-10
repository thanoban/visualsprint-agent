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
    <div className="sticky top-[57px] z-30 flex flex-col gap-3 rounded-2xl border border-border bg-[var(--bg-elevated)]/90 p-4 shadow-sm backdrop-glass print:hidden sm:gap-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
            <FileText size={14} strokeWidth={2} className="text-brand" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">Navigation</p>
        </div>
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
      <nav aria-label="Report sections" className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => (
          <a
            key={section.id}
            className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition-all duration-200 hover:border-brand/40 hover:text-brand hover:shadow-sm hover:-translate-y-0.5"
            href={`#${section.id}`}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
