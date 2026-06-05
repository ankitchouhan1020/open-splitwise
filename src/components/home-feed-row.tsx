import { type RowStripe, rowStripeClass } from "@/lib/balance-style";
import Link from "next/link";
import type { ReactNode } from "react";

const HOME_FEED_ROW_BASE =
  "hover:bg-hover focus-visible:ring-accent flex min-h-[60px] items-center gap-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none";

export const HOME_FEED_ROW_CLASS = `${HOME_FEED_ROW_BASE} px-3 sm:px-4`;

export function homeFeedRowClass(flushX = false, stripe?: RowStripe): string {
  const padding = flushX ? "px-3" : "px-3 sm:px-4";
  return `${HOME_FEED_ROW_BASE} ${padding} ${rowStripeClass(stripe)}`.trim();
}

type HomeFeedRowContentProps = {
  title: ReactNode;
  subline?: ReactNode;
  amount: ReactNode;
  amountClassName?: string;
  hint?: ReactNode;
  hintClassName?: string;
};

function HomeFeedRowContent({
  title,
  subline,
  amount,
  amountClassName = "text-foreground",
  hint,
  hintClassName = "text-muted",
}: HomeFeedRowContentProps) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm leading-snug font-medium">
          {title}
        </p>
        {subline ? (
          <p className="text-muted mt-0.5 truncate text-xs leading-snug">
            {subline}
          </p>
        ) : (
          <p
            className="text-muted mt-0.5 text-xs leading-snug opacity-0"
            aria-hidden
          >
            —
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right leading-snug">
        <span
          className={`text-sm font-semibold tabular-nums ${amountClassName}`}
        >
          {amount}
        </span>
        {hint ? (
          <span className={`text-xs ${hintClassName}`}>{hint}</span>
        ) : (
          <span className="text-xs opacity-0" aria-hidden>
            —
          </span>
        )}
      </div>
    </>
  );
}

type HomeFeedRowLinkProps = HomeFeedRowContentProps & {
  href: string;
  ariaLabel: string;
  flushX?: boolean;
  stripe?: RowStripe;
};

export function HomeFeedRowLink({
  href,
  ariaLabel,
  flushX = false,
  stripe,
  ...content
}: HomeFeedRowLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={homeFeedRowClass(flushX, stripe)}
    >
      <HomeFeedRowContent {...content} />
    </Link>
  );
}

type HomeFeedRowButtonProps = HomeFeedRowContentProps & {
  onClick: () => void;
  ariaLabel?: string;
};

export function HomeFeedRowButton({
  onClick,
  ariaLabel,
  ...content
}: HomeFeedRowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${HOME_FEED_ROW_CLASS} w-full text-left`}
    >
      <HomeFeedRowContent {...content} />
    </button>
  );
}
