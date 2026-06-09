import Link from "next/link";

import { ThemeWrapper } from "../../components/layout/theme-wrapper";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/ui/button-styles";

const highlights = [
  {
    title: "Evidence-backed reports",
    body: "Every decision, commitment, and blocker links back to transcript and visual moments from the meeting.",
  },
  {
    title: "Live intelligence",
    body: "Watch decisions, blockers, and memory matches assemble in real time as the meeting unfolds.",
  },
  {
    title: "Organizational memory",
    body: "Elastic semantic search surfaces recurring blockers and reopened issues across past meetings.",
  },
];

export function LandingPage() {
  return (
    <ThemeWrapper theme="ink">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,168,0.14),_transparent_32%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:gap-16 sm:px-8 sm:py-20 lg:px-10 lg:py-28">
          <section className="max-w-3xl space-y-6">
            <p className="inline-flex rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-brand">
              Meeting intelligence for engineering teams
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Turn meetings into a trustworthy system of record.
            </h1>
            <p className="text-lg leading-8 text-foreground-muted">
              VisualSprint captures live meeting context, reasons across conversation and screen
              evidence with Gemini, checks organizational memory through Elastic, and delivers a
              polished post-meeting report your team can act on.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className={primaryButtonClassName} href="/meetings/new">
                Start a meeting
              </Link>
              <Link className={secondaryButtonClassName} href="/meetings">
                View meetings
              </Link>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[2rem] border border-border bg-surface p-6"
              >
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{item.body}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </ThemeWrapper>
  );
}
