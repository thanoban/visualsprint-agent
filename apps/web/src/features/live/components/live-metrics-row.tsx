"use client";

import type { MeetingDetail } from "@visualsprint/contracts";
import { motion } from "framer-motion";
import {
  GitCommitHorizontal,
  CheckCircle2,
  OctagonAlert,
  Monitor,
  MessageSquareText,
  BrainCircuit,
  Layers,
  HelpCircle,
} from "lucide-react";

import { Sparkline } from "../../../components/ui/sparkline";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const tile = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

const metricsConfig = [
  { key: "decisionsCount", label: "Decisions", icon: GitCommitHorizontal, accent: "border-l-[var(--status-live)]", sparkKey: "signalCount" },
  { key: "commitmentsCount", label: "Commitments", icon: CheckCircle2, accent: "border-l-[var(--accent)]", sparkKey: "signalCount" },
  { key: "blockersCount", label: "Blockers", icon: OctagonAlert, accent: "border-l-[var(--status-error)]", sparkKey: "signalCount" },
  { key: "visualEventsCount", label: "Screen moments", icon: Monitor, accent: "border-l-[var(--accent-memory)]", sparkKey: "visualEventCount" },
  { key: "transcriptSegmentsCount", label: "Transcript lines", icon: MessageSquareText, accent: "border-l-[var(--status-draft)]", sparkKey: "transcriptSegmentCount" },
  { key: "memoryMatchesCount", label: "Memory matches", icon: BrainCircuit, accent: "border-l-[var(--accent-memory)]", sparkKey: "signalCount" },
  { key: "captureChunksCount", label: "Segments", icon: Layers, accent: "border-l-[var(--status-processing)]", sparkKey: "byteSize" },
  { key: "openQuestionsCount", label: "Open questions", icon: HelpCircle, accent: "border-l-[var(--status-ended)]", sparkKey: "signalCount" },
] as const;

function getSparkData(meeting: MeetingDetail, sparkKey: typeof metricsConfig[number]["sparkKey"]): number[] {
  const chunks = meeting.recentCaptureChunks.slice(-12);
  if (!chunks.length) return [];

  if (sparkKey === "byteSize") {
    return chunks.map((c) => Math.round(c.byteSize / 1024));
  }
  return chunks.map((c) => ((c as unknown as Record<string, number>)[sparkKey] ?? 0));
}

export function LiveMetricsRow({ meeting }: { meeting: MeetingDetail }) {
  const { metrics } = meeting;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metricsConfig.map((cfg) => {
        const Icon = cfg.icon;
        const value = metrics[cfg.key];
        const sparkData = getSparkData(meeting, cfg.sparkKey);
        return (
          <motion.div
            key={cfg.key}
            variants={tile}
            className={`group relative overflow-hidden rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ink-border-strong)] hover:shadow-lg ${cfg.accent} border-l-2`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-center gap-2 text-[var(--ink-fg-muted)]">
              <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand/10">
                <Icon size={14} strokeWidth={2} className="text-brand" />
              </div>
              <span className="text-xs uppercase tracking-[0.18em]">{cfg.label}</span>
            </div>
            <motion.p
              key={value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-[var(--ink-fg)]"
            >
              {value}
            </motion.p>
            {sparkData.length > 1 && (
              <div className="mt-2">
                <Sparkline data={sparkData} color="var(--brand)" height={32} />
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
