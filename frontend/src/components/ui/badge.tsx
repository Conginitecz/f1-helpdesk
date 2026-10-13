import type { ReactNode } from "react";

/*
 * Badge - status chips and the product-owner checkpoint tag.
 *
 * DESIGN.md "Components / Chips & Badges":
 *   Status badge   22px tall, 11px Inter 600, fully rounded pill.
 *     positive     #E6F7F5 / #16A085 with a 1px #16A085 border (Verified, Eligible)
 *     negative     #FEE2E2 / #EF4444 with a 1px #EF4444 border (Suspended, Cancelled)
 *     pending      #FEF3C7 / #F59E0B with a 1px #F59E0B border (Pending, Expired)
 *     neutral      canvas surface with the subtle border, for un-stated states
 *   Checkpoint     24px tall, uppercase, JetBrains Mono, #FEF3C7 background,
 *                  #92400E text and a 1px dashed #D97706 border.
 */

export type BadgeTone = "positive" | "negative" | "pending" | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  positive: "border-badge-verified-text bg-badge-verified-bg text-badge-verified-text",
  negative: "border-badge-suspended-text bg-badge-suspended-bg text-badge-suspended-text",
  pending: "border-badge-pending-text bg-badge-pending-bg text-badge-pending-text",
  neutral: "border-border-subtle bg-surface-base text-text-muted",
};

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-pill border px-space-xs font-body text-label-sm font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

interface CheckpointBadgeProps {
  children: ReactNode;
  className?: string;
}

/** The dashed "Pending Product Owner Confirmation" tag from the spec. */
export function CheckpointBadge({ children, className = "" }: CheckpointBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap rounded-control border border-dashed border-po-checkpoint-border bg-po-checkpoint-bg px-space-sm font-mono text-data-mono-sm uppercase tracking-wider text-po-checkpoint-text ${className}`}
    >
      {children}
    </span>
  );
}