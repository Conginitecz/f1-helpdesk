"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icon";

/*
 * Modal - DESIGN.md "Elevation & Depth" level 4 plus the mobile profile.
 *
 *   Desktop (>=768px): centred white panel, 8px radius, level-4 shadow over a
 *     50% #102A43 backdrop.
 *   Mobile (<768px):   the same content as a bottom sheet - anchored to the
 *     bottom edge, rounded top corners only, with its action bar pinned in a
 *     sticky footer so the primary action stays reachable above the viewport
 *     edge (grid profile: "modals transform into bottom sheets with unified
 *     action bars pinned above mobile viewports").
 *   The header uses the Dark Navy token, which the architectural palette
 *   assigns specifically to modal headers.
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Sticky action bar; render Buttons here. */
  actions?: ReactNode;
}

export function Modal({ open, onClose, title, description, children, actions }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    // mousedown (not click) so dragging out of the dialog does not close it.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--f1-modal-backdrop)] md:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-describedby={description ? "modal-description" : undefined}
        aria-labelledby="modal-title"
        aria-modal="true"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-panel bg-surface-card shadow-level-4 outline-none md:max-h-[85vh] md:w-[min(100%-32px,560px)] md:rounded-panel"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-space-md bg-dark-navy px-space-lg py-space-md">
          <div className="min-w-0">
            <h2 className="font-headline text-headline-sm text-white" id="modal-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 font-body text-body-sm text-white/75" id="modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close dialog"
            className="-m-1 rounded-control p-1 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(37,99,235,0.15)]"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="px-space-lg py-space-md">{children}</div>

        {actions ? (
          <footer className="sticky bottom-0 flex flex-wrap justify-end gap-space-sm border-t border-border-subtle bg-surface-card px-space-lg py-space-md">
            {actions}
          </footer>
        ) : null}
      </div>
    </div>
  );
}