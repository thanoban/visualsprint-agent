"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  ArrowRight,
  FileCheck,
  Radio,
  BrainCircuit,
  FileX,
  UserX,
  RotateCcw,
  FileText,
  MonitorOff,
  GitCommitHorizontal,
  CheckSquare,
  Sparkles,
  Paperclip,
  Monitor,
  Mic,
  Search,
  ArrowRightCircle,
} from "lucide-react";

import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { Button } from "../../components/ui/button";
import { HeroMockup } from "../../components/ui/hero-mockup";

const highlights = [
  {
    title: "Evidence-backed reports",
    body: "Every decision, commitment, and blocker links back to transcript and visual moments from the meeting.",
    icon: FileCheck,
  },
  {
    title: "Live intelligence",
    body: "Watch decisions, blockers, and memory matches assemble in real time as the meeting unfolds.",
    icon: Radio,
  },
  {
    title: "Organizational memory",
    body: "Elastic semantic search surfaces recurring blockers and reopened issues across past meetings.",
    icon: BrainCircuit,
  },
];

const painPoints = [
  {
    icon: FileX,
    title: "Decisions disappear",
    body: "Teams leave meetings with no durable record of what was actually decided. Context evaporates within hours.",
  },
  {
    icon: UserX,
    title: "Ownership is vague",
    body: "Commitments are made verbally but never tracked. Follow-ups fall through because no one was named.",
  },
  {
    icon: RotateCcw,
    title: "Same blockers, different week",
    body: "Recurring problems are never flagged against history. The team debates the same issues every sprint.",
  },
  {
    icon: FileText,
    title: "Transcripts are not intelligence",
    body: "A wall of text is not actionable. Hours of conversation reduced to a document no one reads.",
  },
  {
    icon: MonitorOff,
    title: "Visual evidence is lost",
    body: "Screenshots of errors, diagrams, and code reviews vanish. The \u201Cwhy\u201D behind a decision is unprovable.",
  },
];

const solutions = [
  {
    icon: GitCommitHorizontal,
    title: "Decision log",
    body: "Every decision is captured with rationale, speaker, and linked evidence — a permanent system of record.",
  },
  {
    icon: CheckSquare,
    title: "Tracked commitments",
    body: "Clear ownership, due hints, and status tracking so follow-ups actually ship.",
  },
  {
    icon: BrainCircuit,
    title: "Cross-meeting memory",
    body: "Elastic semantic search detects recurring and reopened issues across your full meeting history.",
  },
  {
    icon: Sparkles,
    title: "Structured intelligence",
    body: "Gemini reasons across transcript and screen context to extract decisions, blockers, and open questions automatically.",
  },
  {
    icon: Paperclip,
    title: "Evidence linking",
    body: "Every record is tied to transcript segments and screen moments. Click a decision, see the proof.",
  },
];

const pipelineSteps = [
  {
    icon: Monitor,
    label: "Capture",
    body: "Browser audio + screen context streamed in real time.",
  },
  {
    icon: BrainCircuit,
    label: "Reason",
    body: "Gemini 3 multimodal insight per chunk — not just transcript.",
  },
  {
    icon: Search,
    label: "Memory",
    body: "Elastic ELSER cross-meeting retrieval for recurring issues.",
  },
  {
    icon: FileText,
    label: "Report",
    body: "Evidence-backed final document with decisions, owners, and proof.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const rowContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const rowItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

const rowItemRight = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export function LandingPage() {
  return (
    <ThemeWrapper theme="ink">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,168,0.12),_transparent_35%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 sm:gap-20 sm:px-8 sm:py-20 lg:px-10 lg:py-28">
          {/* Hero */}
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl space-y-6"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand live-pulse" />
                Meeting intelligence for engineering teams
              </span>
            </motion.div>
            <motion.h1
              variants={item}
              className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ lineHeight: 1.1 }}
            >
              Turn meetings into a{" "}
              <span className="text-brand">trustworthy system</span> of record.
            </motion.h1>
            <motion.p
              variants={item}
              className="max-w-2xl text-lg leading-8 text-foreground-muted sm:text-xl sm:leading-9"
            >
              VisualSprint captures live meeting context, reasons across conversation and screen
              evidence with Gemini, checks organizational memory through Elastic, and delivers a
              polished post-meeting report your team can act on.
            </motion.p>
            <motion.div variants={item} className="flex flex-wrap gap-3 pt-2">
              <Link href="/meetings/new">
                <Button size="lg" leftIcon={<Play size={18} strokeWidth={2.5} />}>
                  Start a meeting
                </Button>
              </Link>
              <Link href="/meetings">
                <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} strokeWidth={2} />}>
                  View meetings
                </Button>
              </Link>
            </motion.div>
          </motion.section>

          <HeroMockup />

          {/* Pipeline */}
          <section className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-center"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">How it works</p>
              <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                From capture to evidence-backed report
              </h2>
            </motion.div>

            <div className="relative">
              {/* Connector line (desktop) */}
              <div className="absolute left-0 right-0 top-10 hidden h-px lg:block">
                <div className="relative mx-auto h-full w-3/4 overflow-hidden rounded-full bg-[var(--ink-border)]">
                  <motion.div
                    initial={{ x: "-100%" }}
                    whileInView={{ x: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.3 }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-brand to-transparent"
                  />
                </div>
              </div>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              >
                {pipelineSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.label}
                      variants={item}
                      className="group relative flex flex-col items-center text-center"
                    >
                      <div className="relative z-10 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand/40 group-hover:shadow-glow">
                        <Icon size={24} strokeWidth={2} className="text-brand" />
                      </div>
                      <div className="rounded-xl border border-[var(--ink-border)] bg-[var(--ink-surface)] p-5 shadow-md transition-all duration-200 group-hover:border-border-strong group-hover:shadow-lg">
                        <div className="mb-2 flex items-center justify-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                            {i + 1}
                          </span>
                          <h3 className="text-sm font-semibold tracking-tight text-[var(--ink-fg)]">
                            {step.label}
                          </h3>
                        </div>
                        <p className="text-xs leading-5 text-[var(--ink-fg-muted)]">{step.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>

          {/* Problem / Solution */}
          <section className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-center"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">The problem</p>
              <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Why engineering teams lose decisions
              </h2>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-2">
              <motion.div
                variants={rowContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="space-y-4"
              >
                {painPoints.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={rowItem}
                      className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-[var(--status-error)]/30 hover:shadow-md"
                    >
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)]">
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-foreground-muted">{p.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div
                variants={rowContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="space-y-4"
              >
                {solutions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={rowItemRight}
                      className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-brand/30 hover:shadow-md"
                    >
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-foreground-muted">{s.body}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>

          {/* Feature highlights */}
          <motion.section
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-5 md:grid-cols-3"
          >
            {highlights.map((itemData) => {
              const Icon = itemData.icon;
              return (
                <motion.article
                  key={itemData.title}
                  variants={item}
                  className="group relative rounded-xl border border-border bg-surface p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">{itemData.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-foreground-muted">{itemData.body}</p>
                </motion.article>
              );
            })}
          </motion.section>
        </div>
      </div>
    </ThemeWrapper>
  );
}
