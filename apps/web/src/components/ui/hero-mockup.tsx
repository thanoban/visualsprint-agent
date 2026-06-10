"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 }}
      className="relative mx-auto w-full max-w-2xl lg:max-w-none"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-surface shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]">
        <div className="flex items-center gap-2 border-b border-border bg-[var(--ink-bg-elevated)] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-error)]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-draft)]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-live)]/70" />
          </div>
          <div className="mx-auto flex w-full max-w-xs items-center justify-center rounded-md bg-surface-2 px-3 py-1 text-[11px] text-foreground-muted">
            visualsprint.app/meetings/report
          </div>
        </div>

        <div className="relative overflow-hidden rounded-b-2xl">
          <Image
            src="/images/hero-meeting-report.png"
            alt="VisualSprint meeting report with executive summary, evidence, decisions, commitments, and blockers"
            width={1536}
            height={960}
            priority
            className="h-auto w-full object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--ink-bg)]/40 to-transparent" />
        </div>
      </div>

      <div
        className="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(45,212,168,0.30), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-4 left-1/3 h-16 w-1/3 rounded-full opacity-30 blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.25), transparent 70%)" }}
      />
    </motion.div>
  );
}
