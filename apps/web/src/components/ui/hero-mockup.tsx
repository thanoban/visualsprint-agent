"use client";

import { motion } from "framer-motion";
import {
  GitCommitHorizontal,
  CheckCircle2,
  OctagonAlert,
  Monitor,
  Radio,
} from "lucide-react";

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 8 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 }}
      className="relative mx-auto w-full max-w-4xl perspective-[1200px]"
    >
      <div className="relative transform-gpu rounded-xl border border-[var(--ink-border-strong)] bg-[var(--ink-surface)] shadow-2xl shadow-black/40"
        style={{
          transform: "rotateX(8deg) scale(0.95)",
          transformOrigin: "center top",
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-[var(--ink-border)] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[var(--status-error)]/80" />
            <span className="h-3 w-3 rounded-full bg-[var(--status-draft)]/80" />
            <span className="h-3 w-3 rounded-full bg-[var(--status-live)]/80" />
          </div>
          <div className="mx-auto flex w-full max-w-xs items-center justify-center rounded-md bg-[var(--ink-surface-muted)] px-3 py-1 text-xs text-[var(--ink-fg-muted)]">
            visualsprint.app/meetings/ live
          </div>
        </div>

        {/* Mock content */}
        <div className="p-5">
          {/* Top bar mock */}
          <div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--ink-border)] bg-[var(--ink-bg-elevated)] p-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-24 rounded bg-[var(--ink-surface-muted)]" />
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--status-live)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--status-live)]">
                <Radio size={10} strokeWidth={2.5} className="live-pulse" />
                live
              </span>
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-md bg-[var(--ink-surface-muted)]" />
              <div className="h-7 w-20 rounded-md bg-[var(--status-error)]/20" />
            </div>
          </div>

          {/* Metrics row mock */}
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { icon: GitCommitHorizontal, color: "text-[var(--status-live)]" },
              { icon: CheckCircle2, color: "text-[var(--accent)]" },
              { icon: OctagonAlert, color: "text-[var(--status-error)]" },
              { icon: Monitor, color: "text-[var(--accent-memory)]" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-3"
                >
                  <div className="flex items-center gap-1.5 text-[var(--ink-fg-muted)]">
                    <Icon size={12} strokeWidth={2} />
                    <span className="text-[9px] uppercase tracking-wider">Metric</span>
                  </div>
                  <div className="mt-2 font-mono text-lg font-semibold text-[var(--ink-fg)]">
                    {12 + i * 4}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards mock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-4">
              <div className="h-2 w-16 rounded bg-[var(--ink-surface-2)]" />
              <div className="mt-3 h-2 w-full rounded bg-[var(--ink-surface-2)]" />
              <div className="mt-2 h-2 w-3/4 rounded bg-[var(--ink-surface-2)]" />
            </div>
            <div className="rounded-lg border border-[var(--ink-border)] bg-[var(--ink-surface-muted)] p-4">
              <div className="h-2 w-16 rounded bg-[var(--ink-surface-2)]" />
              <div className="mt-3 h-2 w-full rounded bg-[var(--ink-surface-2)]" />
              <div className="mt-2 h-2 w-2/3 rounded bg-[var(--ink-surface-2)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Glow beneath */}
      <div
        className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(45,212,168,0.25), transparent 70%)" }}
      />
    </motion.div>
  );
}
