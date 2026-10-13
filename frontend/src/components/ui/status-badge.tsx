import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "./badge";

/*
 * StatusBadge - the one mapping from API status words to Badge tones.
 *
 * DESIGN.md "Components / Chips & Badges" assigns the fills; this file only
 * decides which word gets which tone so five screens cannot drift:
 *   active / approved / verified / eligible -> positive (green tint)
 *   inactive / suspended / cancelled / rejected -> negative (red tint)
 *   pending / expired / in progress -> pending (amber tint)
 * Anything unlisted (unknown / resolved / draft) renders neutral rather than
 * guessing a colour.
 */

export function StatusBadge({ status, children }: { status: string; children?: ReactNode }) {
  return <Badge tone={toneFor(status)}>{children ?? status}</Badge>;
}

function toneFor(status: string): BadgeTone {
  const word = status.toLowerCase();
  if (["active", "approved", "verified", "eligible"].includes(word)) return "positive";
  if (["inactive", "suspended", "cancelled", "rejected"].includes(word)) return "negative";
  if (["pending", "expired", "in progress", "pending approval"].includes(word)) return "pending";
  return "neutral";
}
