"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
  Zap,
  Star,
  Quote,
  Mail,
} from "lucide-react";

import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { Button } from "../../components/ui/button";
import { HeroMockup } from "../../components/ui/hero-mockup";

/* ──────────────────────────  Data  ────────────────────────── */

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
    body: "Screenshots of errors, diagrams, and code reviews vanish. The 'why' behind a decision is unprovable.",
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

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Engineering Lead",
    company: "Vercel",
    quote:
      "VisualSprint eliminated our 'what did we decide?' Slack threads. The evidence-linked reports are now our single source of truth for architecture decisions.",
    rating: 5,
    initials: "SC",
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Marcus Johnson",
    role: "Staff Product Manager",
    company: "Linear",
    quote:
      "I used to spend 2 hours writing meeting summaries. Now I get a structured report with decisions and blockers before the meeting ends. It's honestly unfair.",
    rating: 5,
    initials: "MJ",
    color: "bg-teal-500/20 text-teal-400",
  },
  {
    name: "Aiko Tanaka",
    role: "CTO",
    company: "FintechLabs",
    quote:
      "The cross-meeting memory caught a recurring dependency issue we'd been ignoring for 3 sprints. That alone paid for the enterprise plan.",
    rating: 5,
    initials: "AT",
    color: "bg-violet-500/20 text-violet-400",
  },
];



const footerLinks = {
  Product: ["Features", "Integrations", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "API Reference", "Community", "Support"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

/* ──────────────────────────  Animation presets  ────────────────────────── */

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

/* ──────────────────────────  Sub-components  ────────────────────────── */

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={2}
          className={i < count ? "text-amber-400 fill-amber-400" : "text-foreground-muted"}
        />
      ))}
    </div>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 15 + 15;
        return (
          <div
            key={i}
            className="particle"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: `-${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        );
      })}
    </div>
  );
}

function TrustBadge() {
  return (
    <motion.div
      variants={item}
      className="inline-flex items-center gap-3 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm text-foreground-muted shadow-sm backdrop-blur-sm"
    >
      <span className="flex -space-x-2">
        {["bg-blue-500", "bg-teal-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"].map(
          (c, i) => (
            <span
              key={i}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white ${c}`}
            >
              {String.fromCharCode(65 + i)}
            </span>
          )
        )}
      </span>
      <span className="font-medium text-foreground">Trusted by 500+ engineering teams</span>
    </motion.div>
  );
}

/* ──────────────────────────  Sections  ────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,168,0.10),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.08),_transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <ParticleField />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-2xl space-y-6"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand live-pulse" />
                Meeting intelligence for engineering teams
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
              style={{ lineHeight: 1.08 }}
            >
              Turn meetings into your team's{" "}
              <span className="bg-gradient-to-r from-brand via-[#5eead4] to-[#38bdf8] bg-clip-text text-transparent">
                system of record
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="max-w-xl text-lg leading-8 text-foreground-muted sm:text-xl sm:leading-9"
            >
              AI-powered meeting intelligence that captures context, surfaces insights, and delivers
              evidence-backed reports your engineering team can act on.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3 pt-2">
              <Link href="/meetings/new">
                <Button size="lg" leftIcon={<Play size={18} strokeWidth={2.5} />} className="shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all hover:-translate-y-0.5">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/meetings">
                <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} strokeWidth={2} />} className="hover:-translate-y-0.5 transition-all">
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={item} className="pt-2">
              <TrustBadge />
            </motion.div>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.3 }}
            className="relative"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const logos = [
    { name: "Vercel", abbr: "▲" },
    { name: "Linear", abbr: "⌘" },
    { name: "Stripe", abbr: "S" },
    { name: "Notion", abbr: "N" },
    { name: "Figma", abbr: "F" },
    { name: "GitHub", abbr: "<>" },
    { name: "Slack", abbr: "#" },
    { name: "Datadog", abbr: "D" },
  ];

  return (
    <section className="relative border-y border-border bg-[var(--ink-bg-elevated)]/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
          Used by teams at
        </p>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee gap-12 whitespace-nowrap">
            {[...logos, ...logos].map((logo, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 text-lg font-semibold text-foreground-muted/60 transition hover:text-foreground-muted"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-sm">
                  {logo.abbr}
                </span>
                {logo.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Features</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need to remember everything
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Three pillars that turn chaotic meetings into structured, actionable intelligence.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {highlights.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                variants={item}
                className="group relative rounded-2xl border border-border bg-surface p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand/20">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{f.body}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">How it works</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            From capture to evidence-backed report
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connector line desktop */}
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
      </div>
    </section>
  );
}

function LiveDemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#38bdf8]/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38bdf8]">Live Demo</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Watch decisions, blockers, and memory matches assemble in real time
          </h2>
        </motion.div>

        <motion.div style={{ y }} className="relative mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-[var(--ink-surface)] shadow-2xl demo-scanline">
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20" />

            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-error)]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-draft)]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-live)]/70" />
                </div>
                <span className="ml-3 text-xs text-foreground-muted">visualsprint.app/live</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--status-live)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--status-live)]">
                <Radio size={10} strokeWidth={2.5} className="live-pulse" />
                Capturing
              </span>
            </div>

            <div className="grid gap-px bg-border lg:grid-cols-3">
              {/* Left: Transcript */}
              <div className="bg-[var(--ink-surface)] p-5">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <Mic size={14} strokeWidth={2} />
                  Transcript
                </div>
                <div className="space-y-3">
                  {[
                    { w: "85%", highlight: false },
                    { w: "60%", highlight: true },
                    { w: "90%", highlight: false },
                    { w: "45%", highlight: true },
                    { w: "75%", highlight: false },
                  ].map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-surface-2" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 rounded bg-surface-2" style={{ width: line.w }} />
                        {line.highlight && (
                          <div className="h-2 rounded bg-brand/20" style={{ width: "40%" }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center: Decisions */}
              <div className="bg-[var(--ink-surface)] p-5">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <GitCommitHorizontal size={14} strokeWidth={2} />
                  Decisions
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Migrate to new auth service", color: "border-brand/30 bg-brand/5" },
                    { label: "Deprecate legacy API v1", color: "border-[#38bdf8]/30 bg-[#38bdf8]/5" },
                    { label: "Adopt pnpm monorepo", color: "border-brand/30 bg-brand/5" },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border ${d.color} p-3 transition hover:-translate-y-0.5`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} strokeWidth={2} className="text-brand" />
                        <span className="text-sm font-medium">{d.label}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-2/3 rounded bg-surface-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Memory */}
              <div className="bg-[var(--ink-surface)] p-5">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <Search size={14} strokeWidth={2} />
                  Memory Matches
                </div>
                <div className="space-y-3">
                  {[
                    { title: "Similar blocker: Jan 12", type: "Recurring" },
                    { title: "Auth migration — Q4 plan", type: "Related" },
                    { title: "API v1 sunset discussion", type: "Previous" },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-surface-2 p-3 transition hover:-translate-y-0.5 hover:border-[var(--accent-memory)]/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{m.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-memory)]">
                          {m.type}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-1/2 rounded bg-surface-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <div className="flex items-center gap-4 text-xs text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <Monitor size={12} strokeWidth={2} />
                  12 captures
                </span>
                <span className="flex items-center gap-1.5">
                  <BrainCircuit size={12} strokeWidth={2} />
                  4 insights
                </span>
              </div>
              <div className="h-2 w-24 rounded-full bg-surface-2">
                <div className="h-full w-3/4 rounded-full bg-brand/40" />
              </div>
            </div>
          </div>

          {/* Glow */}
          <div
            className="pointer-events-none absolute -bottom-10 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.20), transparent 70%)" }}
          />
        </motion.div>
      </div>
    </section>
  );
}

function ProblemSolutionSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">The problem</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
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
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-[var(--status-error)]/30 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)]">
                    <Icon size={18} strokeWidth={2} />
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
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-brand/30 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon size={18} strokeWidth={2} />
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
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-14 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Testimonials</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by engineering leaders
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.article
              key={t.name}
              variants={item}
              className="group relative rounded-2xl border border-border bg-surface p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <Quote size={24} strokeWidth={2} className="mb-4 text-brand/40" />
              <StarRating count={t.rating} />
              <p className="mt-4 text-sm leading-7 text-foreground-muted">{t.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${t.color}`}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[var(--ink-surface)] to-[var(--ink-surface-2)] p-10 text-center shadow-2xl sm:p-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,168,0.08),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.06),_transparent_50%)]" />

          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to stop forgetting meetings?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
              Join 500+ engineering teams who use VisualSprint to turn conversations into action.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/meetings/new">
                <Button size="lg" leftIcon={<Zap size={18} strokeWidth={2.5} />} className="shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all hover:-translate-y-0.5">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/meetings">
                <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} strokeWidth={2} />} className="hover:-translate-y-0.5 transition-all">
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-foreground-subtle">No credit card required. 14-day free trial.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--ink-bg-elevated)]/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-fg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-lg font-semibold tracking-tight">VisualSprint</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-foreground-muted">
              AI-powered meeting intelligence that captures context, surfaces insights, and delivers evidence-backed reports.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted transition hover:border-brand/30 hover:text-brand"
                aria-label="Twitter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted transition hover:border-brand/30 hover:text-brand"
                aria-label="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted transition hover:border-brand/30 hover:text-brand"
                aria-label="LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{category}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-foreground-muted transition hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter + Bottom */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex w-full max-w-sm items-center gap-2">
              <div className="relative flex-1">
                <Mail size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground placeholder-foreground-muted transition focus:border-brand focus:outline-none"
                />
              </div>
              <Button size="md">Subscribe</Button>
            </div>
            <p className="text-xs text-foreground-subtle">
              © {new Date().getFullYear()} VisualSprint, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────  Page export  ────────────────────────── */

export function LandingPage() {
  return (
    <ThemeWrapper theme="ink">
      <div className="relative">
        <HeroSection />
        <TrustBar />
        <FeaturesSection />
        <HowItWorksSection />
        <LiveDemoSection />
        <ProblemSolutionSection />
        <TestimonialsSection />
        <CTABanner />
        <Footer />
      </div>
    </ThemeWrapper>
  );
}
