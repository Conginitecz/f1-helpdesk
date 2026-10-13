import type { ReactNode } from "react";

/*
 * Notice - single-line success / error feedback inside a screen body.
 *
 * This is the small inline message (created/confirmed/failed), not the
 * large loading/empty/error panel (ScreenState) and not the operational
 * banner (Banner). Success uses the accent green edge with the verified
 * tint fill; error uses the alert edge with the suspended fill. Both keep
 * the 3px left accent the legacy .form-error/.success-message treatment
 * used, so placement and emphasis are unchanged - only the palette and
 * type move to the tokens.
 */

type NoticeTone = "success" | "error";

interface NoticeProps {
  tone?: NoticeTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<NoticeTone, string> = {
  success: "border-accent-green bg-badge-verified-bg text-text-primary",
  error: "border-error-alert bg-badge-suspended-bg text-text-primary",
};

export function Notice({ tone = "success", children, className = "" }: NoticeProps) {
  return (
    <p
      className={`rounded-control border border-l-4 px-space-md py-space-sm font-body text-body-md ${toneClasses[tone]} ${className}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
