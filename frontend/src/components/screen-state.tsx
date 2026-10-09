interface ScreenStateProps {
  kind: "loading" | "empty" | "error";
  message: string;
  onRetry?: () => void;
}

export function ScreenState({ kind, message, onRetry }: ScreenStateProps) {
  return (
    <div className={`screen-state screen-state-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <p>{message}</p>
      {onRetry && <button className="text-button" onClick={onRetry} type="button">Try again</button>}
    </div>
  );
}
