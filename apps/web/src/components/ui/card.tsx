import type { ReactNode } from "react";

export function Card({
  title,
  eyebrow,
  children,
  dark = false,
  className = "",
  glow = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section
      className={`group relative rounded-xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        dark
          ? "border-[var(--ink-border)] bg-[var(--ink-surface)] text-[var(--ink-fg)]"
          : "border-border bg-surface text-foreground"
      } ${glow ? "shadow-glow" : "shadow-md"} ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <p
        className={`text-xs uppercase tracking-[0.2em] ${
          dark ? "text-[var(--ink-fg-muted)]" : "text-foreground-muted"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          dark ? "text-[var(--ink-fg)]" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
