import { formatAmount, formatMoney, formatPercent } from "@/lib/format";
import Link from "next/link";

type Props = {
  totalSpend: number;
  expenseCount: number;
  currency?: string;
  periodLabel: string;
  isAllTime: boolean;
  delta: number;
  deltaPct: number | null;
  yoyDelta: number;
  yoyDeltaPct: number | null;
  topCategory?: {
    categoryId: number | null;
    categoryName: string;
    total: string;
  } | null;
  exploreCategoryHref?: string;
};

function DeltaLine({
  value,
  pct,
  label,
}: {
  value: number;
  pct: number | null;
  label: string;
}) {
  const up = value > 0;
  const down = value < 0;
  return (
    <span
      className={
        up ? "text-balance-pay" : down ? "text-balance-get" : "text-muted"
      }
    >
      {label} {up ? "+" : ""}
      {pct != null ? formatPercent(pct) : "—"}
    </span>
  );
}

export function InsightsSummary({
  totalSpend,
  expenseCount,
  currency,
  periodLabel,
  isAllTime,
  delta,
  deltaPct,
  yoyDelta,
  yoyDeltaPct,
  topCategory,
  exploreCategoryHref,
}: Props) {
  const fmt = (n: number) =>
    currency ? formatMoney(n, currency) : formatAmount(n);
  const avg = expenseCount ? totalSpend / expenseCount : 0;

  return (
    <header className="space-y-1">
      <p className="text-muted text-sm">{periodLabel}</p>
      <p className="text-foreground text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {fmt(totalSpend)}
        <span className="text-muted ml-2 text-base font-normal">
          your share
        </span>
      </p>
      <p className="text-muted text-sm">
        {expenseCount.toLocaleString()} expenses
        {expenseCount > 0 ? <> · {fmt(avg)} avg</> : null}
        {!isAllTime ? (
          <>
            {" "}
            · <DeltaLine value={delta} pct={deltaPct} label="vs prev" />
            {" · "}
            <DeltaLine value={yoyDelta} pct={yoyDeltaPct} label="YoY" />
          </>
        ) : null}
      </p>
      {topCategory && exploreCategoryHref ? (
        <p className="text-muted text-sm">
          Top category{" "}
          <Link
            href={exploreCategoryHref}
            className="text-accent font-medium hover:underline"
          >
            {topCategory.categoryName}
          </Link>
          {" · "}
          {fmt(Number(topCategory.total))}
        </p>
      ) : null}
    </header>
  );
}
