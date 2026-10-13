import type { ButtonHTMLAttributes } from "react";

/*
 * Button - the shared action control for the whole product.
 *
 * Every value comes from the DESIGN.md "Components / Buttons" spec:
 *   Primary      #2563EB on white text, hover #1E3A8A, 4px radius, 36px tall
 *                (8px/16px padding).
 *   Secondary    white surface, 1px #D9E3EA border, #172B4D text, hover
 *                #F5F9FA with the border darkening to #172B4D.
 *   Destructive  #EF4444, hover #DC2626 - reserved for revoke/reject/cancel.
 *   Compact      28px tall, 12px text, 4px/8px padding, for table row actions.
 *   Disabled     #D9E3EA background with #64748B text.
 *
 * The focus ring mirrors the form-input focus treatment (2px rgba(37, 99,
 * 235, 0.15)) so tabbing through a form looks identical everywhere.
 */

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "md" | "compact";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-info-blue text-white hover:bg-deep-blue disabled:bg-border-subtle disabled:text-text-muted",
  secondary:
    "border border-border-subtle bg-surface-card text-text-primary hover:border-text-primary hover:bg-surface-base disabled:border-border-subtle disabled:bg-surface-card disabled:text-text-muted",
  destructive:
    "bg-error-alert text-white hover:bg-destructive-hover disabled:bg-border-subtle disabled:text-text-muted",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-base disabled:text-text-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  // 36px tall with 8px/16px padding: the enterprise standard in the spec.
  md: "h-9 px-space-md",
  // 28px tall with 4px/8px padding and 12px text: compact table action.
  compact: "h-7 px-space-sm py-space-xs text-label-md",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex select-none items-center justify-center gap-space-xs rounded-control font-body font-medium transition focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(37,99,235,0.15)] disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${size === "md" ? "text-label-lg" : ""} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}