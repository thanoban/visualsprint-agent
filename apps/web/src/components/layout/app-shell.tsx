"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { showDevPanels } from "../../lib/env";

const navItems = [
  { href: "/meetings", label: "Meetings" },
  { href: "/meetings/new", label: "New meeting" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-[var(--bg-elevated)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-fg">
              VS
            </span>
            <span className="text-lg font-semibold tracking-tight">VisualSprint</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand/15 text-brand"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {showDevPanels() ? (
              <Link
                href="/dev"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  pathname === "/dev"
                    ? "bg-brand/15 text-brand"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Dev
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
