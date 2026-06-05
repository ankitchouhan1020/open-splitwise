"use client";

import {
  balanceClasses,
  balanceNetLabel,
  balanceSectionLabel,
} from "@/lib/balance-style";
import { formatMoney } from "@/lib/format";
import { useFriendsBalances } from "@/lib/query/hooks";
import { SPLITWISE_HOME_URL } from "@/lib/splitwise/urls";
import Link from "next/link";

function FriendCard({
  name,
  amount,
  currency,
  direction,
}: {
  name: string;
  amount: number;
  currency: string;
  direction: "to_get" | "to_pay";
}) {
  const tone = direction === "to_get" ? "you_are_owed" : "you_owe";
  const styles = balanceClasses(tone);

  return (
    <li className="border-border bg-card rounded-xl border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold">
            {name}
          </p>
          <p
            className={`mt-1 text-lg font-semibold tabular-nums ${styles.amount}`}
          >
            {formatMoney(amount, currency)}
          </p>
        </div>
        <a
          href={SPLITWISE_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={
            direction === "to_get"
              ? "bg-balance-get-bg text-balance-get hover:bg-hover shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
              : "bg-balance-pay-bg text-balance-pay hover:bg-hover shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
          }
        >
          {direction === "to_get" ? "Remind" : "Settle up →"}
        </a>
      </div>
    </li>
  );
}

export function FriendsDashboard() {
  const { data, isLoading, isError } = useFriendsBalances();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="border-border bg-card h-28 animate-pulse rounded-xl border" />
        <div className="border-border bg-card h-20 animate-pulse rounded-xl border" />
        <div className="border-border bg-card h-20 animate-pulse rounded-xl border" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
        Could not load friend balances. Try syncing or reconnecting Splitwise.
      </p>
    );
  }

  const { currency, summary, toGet, toPay } = data;
  const settled = summary.net === 0 && toGet.length === 0 && toPay.length === 0;
  const netTone = settled ? null : summary.net < 0 ? "you_owe" : "you_are_owed";

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border p-4 shadow-sm md:rounded-2xl md:p-5 ${
          settled || !netTone
            ? "border-border bg-card"
            : balanceClasses(netTone).card
        }`}
      >
        <p className="text-muted text-xs font-medium tracking-wide uppercase">
          Overall · {currency}
        </p>
        {settled ? (
          <p className="text-foreground mt-1 text-lg font-semibold">
            All settled up
          </p>
        ) : (
          <>
            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                netTone ? balanceClasses(netTone).amount : ""
              }`}
            >
              {formatMoney(Math.abs(summary.net), currency)}
            </p>
            <p
              className={`text-xs font-medium ${
                netTone ? balanceClasses(netTone).label : "text-muted"
              }`}
            >
              {netTone ? balanceNetLabel(netTone) : ""}
            </p>
            {(summary.youAreOwed > 0 || summary.youOwe > 0) && (
              <p className="text-muted mt-2 text-xs tabular-nums">
                {summary.youAreOwed > 0 && (
                  <span className="text-balance-get">
                    {formatMoney(summary.youAreOwed, currency)} to get
                  </span>
                )}
                {summary.youAreOwed > 0 && summary.youOwe > 0 && " · "}
                {summary.youOwe > 0 && (
                  <span className="text-balance-pay">
                    {formatMoney(summary.youOwe, currency)} to pay
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {toGet.length > 0 && (
        <section>
          <h2
            className={`mb-2 text-xs font-semibold tracking-wide uppercase ${balanceClasses("you_are_owed").label}`}
          >
            {balanceSectionLabel("you_are_owed")}
          </h2>
          <ul className="space-y-2">
            {toGet.map((f) => (
              <FriendCard
                key={f.id}
                name={f.name}
                amount={f.amount}
                currency={currency}
                direction="to_get"
              />
            ))}
          </ul>
        </section>
      )}

      {toPay.length > 0 && (
        <section>
          <h2
            className={`mb-2 text-xs font-semibold tracking-wide uppercase ${balanceClasses("you_owe").label}`}
          >
            {balanceSectionLabel("you_owe")}
          </h2>
          <ul className="space-y-2">
            {toPay.map((f) => (
              <FriendCard
                key={f.id}
                name={f.name}
                amount={f.amount}
                currency={currency}
                direction="to_pay"
              />
            ))}
          </ul>
        </section>
      )}

      <p className="text-muted text-center text-xs">
        <Link
          href="/explore"
          className="text-accent font-medium hover:underline"
        >
          Explore expenses
        </Link>
        {" · "}
        <a
          href={SPLITWISE_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent font-medium hover:underline"
        >
          Open Splitwise
        </a>
      </p>
    </div>
  );
}
