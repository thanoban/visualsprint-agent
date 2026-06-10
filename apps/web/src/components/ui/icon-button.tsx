import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "default" | "ghost";
}

export function IconButton({
  icon,
  label,
  variant = "default",
  className = "",
  ...props
}: IconButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "ghost"
      ? "h-9 w-9 text-foreground-muted hover:text-foreground hover:bg-surface-2"
      : "h-9 w-9 border border-border bg-surface text-foreground hover:bg-surface-2 shadow-sm";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`${base} ${styles} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
