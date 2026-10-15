import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/*
 * Table primitives - DESIGN.md "Components / Tables & Data Grids":
 *   Header  #F5F9FA background, 2px #D9E3EA bottom border, #172B4D text,
 *           uppercase, 11px, weight 700.
 *   Row     44px tall with a 1px #D9E3EA bottom border, #F0F4F8 on hover.
 *   Cells   8px/16px padding; IDs and figures in JetBrains Mono with tabular
 *           figures so columns line up (DESIGN.md typography rules 1 and 2).
 *
 * TableWrap scrolls horizontally rather than widening the page. A wide grid
 * must create a scrollbar inside its own frame, never at the viewport - that
 * was the failure mode the Phase 2 browser check caught on Locations & admins.
 */

export function TableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-panel border border-border-subtle bg-surface-card shadow-level-1 ${className}`}
    >
      {children}
    </div>
  );
}

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <table className={`w-full border-collapse border-spacing-0 font-body text-body-md ${className}`}>{children}</table>
  );
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b-2 border-border-subtle bg-surface-base px-space-md py-space-sm text-left text-label-sm font-bold uppercase text-text-primary ${className}`}
      scope="col"
      {...props}
    >
      {children}
    </th>
  );
}

/** A data row: 44px tall, hairline bottom border, subtle hover fill. */
export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`transition-colors hover:bg-row-hover ${className}`}>{children}</tr>;
}

export function Td({ children, className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`h-[var(--f1-row-height)] border-b border-border-subtle px-space-md py-space-sm text-text-primary ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

/** Cell for request IDs, hashes, fees and other telemetry. */
export function MonoTd({ children, className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`h-[var(--f1-row-height)] border-b border-border-subtle px-space-md py-space-sm font-mono text-data-mono-sm tabular-nums text-text-primary ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}