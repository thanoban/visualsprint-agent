import type { ReactNode } from "react";

export type AppTheme = "ink" | "paper";

export function ThemeWrapper({
  theme,
  children,
}: {
  theme: AppTheme;
  children: ReactNode;
}) {
  return (
    <div data-theme={theme} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
