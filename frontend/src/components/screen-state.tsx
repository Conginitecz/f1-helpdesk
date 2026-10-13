import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";

interface ScreenStateProps {
  kind: "loading" | "empty" | "error";
  message: string;
  onRetry?: () => void;
}

/*
 * Loading / empty / error placeholder for a screen body.
 *
 * Rewritten in Phase 2 to consume the design tokens instead of the legacy
 * .screen-state classes: same props and same usage sites, but the panel,
 * spacing, type and colour now come from DESIGN.md (Level 1 surface, 8px
 * radius, semantic error colour) so it matches the rest of the console.
 * The error state keeps role="alert" so it is announced rather than silent.
 */

const toneClasses = {
  loading: "border-border-subtle text-text-muted",
  empty: "border-border-subtle text-text-muted",
  error: "border-error-alert text-text-primary",
} as const;

const toneIcons = {
  loading: "sync",
  empty: "search",
  error: "error",
} as const;

export function ScreenState({ kind, message, onRetry }: ScreenStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-space-sm rounded-panel border bg-surface-card px-space-lg py-space-xl text-center shadow-level-1 ${toneClasses[kind]}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <Icon
        className={kind === "error" ? "text-error-alert" : "text-text-muted"}
        name={toneIcons[kind]}
        size={24}
      />
      <p className="font-body text-body-md text-text-primary">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} size="compact" variant="secondary">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
