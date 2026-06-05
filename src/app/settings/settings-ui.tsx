const card = "border-border bg-card overflow-hidden rounded-lg border";

export function SettingsSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={card}>
      <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-foreground text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-muted mt-0.5 text-xs leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "error" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    ok: "bg-balance-get-bg text-success-text",
    warn: "bg-balance-pay-bg text-warn-text",
    error: "bg-error-bg text-error-text",
    neutral: "bg-muted-surface text-foreground",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function SettingsStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-muted-surface rounded-md border px-3 py-2">
      <p className="text-muted text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p className="text-foreground mt-0.5 text-sm font-medium tabular-nums">
        {value}
      </p>
      {sub && <p className="text-muted mt-0.5 text-xs">{sub}</p>}
    </div>
  );
}

export function SettingsAlert({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-success-bg text-success-text border-success-border",
    error: "bg-error-bg text-error-text border-error-border",
    info: "bg-muted-surface text-foreground border-border",
  };
  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm leading-relaxed ${styles[tone]}`}
    >
      {children}
    </p>
  );
}
