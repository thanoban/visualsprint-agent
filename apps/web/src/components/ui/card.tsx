import type { ReactNode } from "react";

export function Card({
  title,
  eyebrow,
  children,
  dark = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] ${
        dark
          ? "border-[var(--ink-border)] bg-[var(--ink-surface)] text-[var(--ink-fg)]"
          : "border-border bg-surface text-foreground"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-[0.24em] ${
          dark ? "text-[var(--ink-fg-muted)]" : "text-foreground-muted"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className={`mt-2 text-2xl font-semibold ${dark ? "text-[var(--ink-fg)]" : "text-foreground"}`}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
