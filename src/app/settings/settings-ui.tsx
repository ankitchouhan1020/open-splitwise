import type { ReactNode } from "react";

const card = "border-border bg-card overflow-hidden rounded-lg border";

export function SettingsSection({
  title,
  description,
  children,
  action,
  bare = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  bare?: boolean;
}) {
  if (bare) {
    return <section>{children}</section>;
  }

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

export function SettingsBlock({
  title,
  description,
  children,
  embedded = false,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  embedded?: boolean;
}) {
  const showHeader = !embedded && (title || description);

  return (
    <section className={card}>
      {showHeader ? (
        <div className="border-border border-b px-4 py-3 md:px-5">
          {title ? (
            <h3 className="text-foreground text-sm font-semibold">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-muted mt-0.5 text-xs leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="divide-border divide-y">{children}</div>
    </section>
  );
}

/** GitHub-style danger zone for destructive actions. */
export function SettingsDangerZone({
  title = "Danger zone",
  description = "Irreversible or sensitive actions.",
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-error-border bg-card overflow-hidden rounded-lg border">
      <div className="border-error-border/60 border-b px-4 py-3 md:px-5">
        <h3 className="text-error-text text-sm font-semibold">{title}</h3>
        <p className="text-muted mt-0.5 text-xs leading-relaxed">
          {description}
        </p>
      </div>
      <div className="divide-border divide-y">{children}</div>
    </section>
  );
}

export function SettingsProfileStrip({
  initials,
  name,
  email,
  badge,
}: {
  initials: string;
  name: string;
  email: string;
  badge: ReactNode;
}) {
  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-lg border px-4 py-3.5">
      <div
        className="bg-accent/10 text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{name}</p>
        <p className="text-muted truncate text-sm">{email}</p>
      </div>
      {badge}
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  variant = "default",
}: {
  label: string;
  description?: string;
  children?: ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <div
      className={
        variant === "danger"
          ? "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5"
          : "flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5"
      }
    >
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-muted mt-0.5 text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
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
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}
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
    <div className="border-border bg-muted-surface/80 rounded-lg border px-3.5 py-3">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="text-foreground mt-1 text-base font-semibold tabular-nums">
        {value}
      </p>
      {sub ? <p className="text-muted mt-1 text-xs">{sub}</p> : null}
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
    <div
      className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${styles[tone]}`}
    >
      {children}
    </div>
  );
}
