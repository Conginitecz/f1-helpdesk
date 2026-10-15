import type { ReactNode } from "react";

/*
 * Banner - DESIGN.md "Components / Operational Banners".
 *
 * The checkpoint tone is the Pending Product Owner Confirmation treatment:
 * #FEF3C7 background, 1px #D97706 border and a 4px left accent in the same
 * colour, with the checkpoint ID rendered in JetBrains Mono (typography rule
 * 1 - IDs are always monospace so they can be read over a phone).
 *
 * info / danger reuse the same geometry with the semantic tokens so an
 * operational notice and a blocker look like the same family of component.
 */

export type BannerTone = "checkpoint" | "info" | "danger";

interface BannerProps {
  tone?: BannerTone;
  /** Short headline; for a checkpoint this is the `[PO-09: …]` identifier. */
  title: string;
  children?: ReactNode;
  className?: string;
}

const toneClasses: Record<BannerTone, string> = {
  checkpoint: "border-po-checkpoint-border bg-po-checkpoint-bg text-po-checkpoint-text",
  info: "border-info-blue bg-surface-base text-text-primary",
  danger: "border-error-alert bg-badge-suspended-bg text-badge-suspended-text",
};

const titleClasses: Record<BannerTone, string> = {
  checkpoint: "font-mono text-data-mono-md uppercase tracking-wide",
  info: "font-body text-label-lg font-semibold",
  danger: "font-body text-label-lg font-semibold",
};

export function Banner({ tone = "info", title, children, className = "" }: BannerProps) {
  return (
    <div
      className={`flex gap-space-sm rounded-control border border-l-4 p-space-md ${toneClasses[tone]} ${className}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      <div className="min-w-0">
        <p className={titleClasses[tone]}>{title}</p>
        {children ? (
          <div className="mt-1 font-body text-body-sm [&_p]:mt-1">{children}</div>
        ) : null}
      </div>
    </div>
  );
}