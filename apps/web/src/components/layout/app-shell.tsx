"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutList, PlusCircle, Sun, Moon, Monitor } from "lucide-react";

import { ApiStatusBadge } from "./api-status-badge";
import { useTheme } from "../providers/theme-provider";
import { showDevPanels } from "../../lib/env";

const navItems = [
  { href: "/meetings", label: "Meetings", icon: LayoutList },
  { href: "/meetings/new", label: "New meeting", icon: PlusCircle },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme, theme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-[var(--bg-elevated)]/80 backdrop-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-8 sm:py-3.5 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-fg">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight">
              VisualSprint
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ApiStatusBadge />
            <nav
              aria-label="Primary"
              className="flex items-center gap-1 overflow-x-auto"
            >
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand/15 text-brand"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              {showDevPanels() ? (
                <Link
                  href="/dev"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pathname === "/dev"
                      ? "bg-brand/15 text-brand"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-2"
                  }`}
                >
                  Dev
                </Link>
              ) : null}
            </nav>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  setTheme(
                    theme === "system"
                      ? resolvedTheme === "ink"
                        ? "paper"
                        : "ink"
                      : theme === "ink"
                        ? "paper"
                        : "system",
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition hover:bg-surface-2 hover:text-foreground"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === "system" ? (
                  <Monitor size={16} strokeWidth={2} />
                ) : resolvedTheme === "ink" ? (
                  <Moon size={16} strokeWidth={2} />
                ) : (
                  <Sun size={16} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
