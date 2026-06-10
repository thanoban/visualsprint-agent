import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-fg hover:bg-brand-hover active:scale-[0.97] shadow-sm hover:shadow-md",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-2 active:scale-[0.97] shadow-sm",
  ghost:
    "text-foreground-muted hover:text-foreground hover:bg-surface-2 active:scale-[0.97]",
  danger:
    "bg-[var(--status-error)]/15 text-[var(--status-error)] hover:bg-[var(--status-error)]/25 active:scale-[0.97]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "rounded-lg px-3 py-1.5 text-xs gap-1.5",
  md: "rounded-lg px-4 py-2 text-sm gap-2",
  lg: "rounded-xl px-5 py-2.5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      isLoading,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={`
        inline-flex items-center justify-center
        font-semibold
        transition-all
        duration-200
        disabled:cursor-not-allowed disabled:opacity-60
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        {...props}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  },
);
