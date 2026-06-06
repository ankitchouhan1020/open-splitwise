"use client";

import { ui } from "@/lib/ui-classes";

type Props = {
  explanation: string | null;
  warnings: string[];
  totalLine: string | null;
  loading: boolean;
  error: string | null;
  onDismiss: () => void;
  embedded?: boolean;
};

export function ExploreAiResult({
  explanation,
  warnings,
  totalLine,
  loading,
  error,
  onDismiss,
  embedded = false,
}: Props) {
  const visible =
    loading || Boolean(error) || Boolean(explanation) || warnings.length > 0;
  if (!visible) return null;

  const inner = (
    <>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-muted text-xs font-medium tracking-wide uppercase">
          Smart filter
        </p>
        {!loading && (explanation || error) ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted hover:text-foreground rounded px-1 text-sm leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-muted text-sm">Asking…</p>
      ) : error ? (
        <p className={ui.errorBox}>{error}</p>
      ) : explanation ? (
        <div className="space-y-1.5">
          <p className="text-foreground text-sm leading-relaxed">
            {explanation}
          </p>
          {totalLine ? (
            <p className="text-muted text-xs tabular-nums">{totalLine}</p>
          ) : null}
          {warnings.map((warning) => (
            <p
              key={warning}
              className="border-warn-border bg-warn-bg text-warn-text rounded-md border px-2 py-1.5 text-xs leading-relaxed"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div role="status" aria-live="polite" aria-busy={loading}>
        {inner}
      </div>
    );
  }

  return (
    <div
      className="border-border bg-muted-surface/60 rounded-lg border px-3.5 py-3"
      role="status"
      aria-live="polite"
      aria-busy={loading}
    >
      {inner}
    </div>
  );
}
