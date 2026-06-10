import type { ReactNode } from "react";

export function Field({
  label,
  children,
  muted = false,
}: {
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className={`text-sm font-medium ${muted ? "text-foreground-muted" : "text-foreground"}`}>
        {label}
      </span>
      {children}
    </label>
  );
}
