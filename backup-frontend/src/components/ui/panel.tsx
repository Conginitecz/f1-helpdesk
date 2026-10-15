import type { ReactNode } from "react";

/*
 * Panel - the Level 1 surface from DESIGN.md "Elevation & Depth":
 * a white card on the #F5F9FA canvas, 1px #D9E3EA border, the ultra-subtle
 * ambient shadow and the 8px panel radius reserved for macroscopic
 * containers (cards, modals, drawers) as opposed to 4px controls.
 */

interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Rendered as a heading and wired to the region for screen readers. */
  title?: string;
  /** Right-hand slot in the panel header, usually one or two buttons. */
  action?: ReactNode;
}

export function Panel({ children, className = "", title, action }: PanelProps) {
  const headingId = title ? "panel-heading" : undefined;

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-panel border border-border-subtle bg-surface-card shadow-level-1 ${className}`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-space-md border-b border-border-subtle px-space-md py-space-sm">
          <h2 className="font-headline text-headline-sm text-text-primary" id={headingId}>
            {title}
          </h2>
          {action ? <div className="flex items-center gap-space-sm">{action}</div> : null}
        </header>
      ) : null}
      <div className="p-space-md">{children}</div>
    </section>
  );
}