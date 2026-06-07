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
  titleClassName?: string;
  subline?: ReactNode;
  amount?: ReactNode;
  amountClassName?: string;
  hint?: ReactNode;
  hintClassName?: string;
  hideHint?: boolean;
};

export function HomeFeedRowContent({
  title,
  titleClassName = "text-foreground",
  subline,
  amount,
  amountClassName = "text-foreground",
  hint,
  hintClassName = "text-muted",
  hideHint = false,
}: HomeFeedRowContentProps) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm leading-snug font-medium tabular-nums ${titleClassName}`}
        >
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
      {amount != null ? (
        <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 text-right leading-snug">
          <span
            className={`text-sm font-semibold tabular-nums ${amountClassName}`}
          >
            {amount}
          </span>
          {hint && !hideHint ? (
            <span className={`text-xs whitespace-nowrap ${hintClassName}`}>
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

type HomeFeedRowActionsProps = HomeFeedRowContentProps & {
  href: string;
  ariaLabel: string;
  flushX?: boolean;
  stripe?: RowStripe;
  action?: ReactNode;
};

export function HomeFeedRowActions({
  href,
  ariaLabel,
  flushX = false,
  stripe,
  action,
  ...content
}: HomeFeedRowActionsProps) {
  return (
    <div className={homeFeedRowClass(flushX, stripe)}>
      <Link
        href={href}
        aria-label={ariaLabel}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <HomeFeedRowContent {...content} hideHint={Boolean(action)} />
      </Link>
      {action ? (
        <div className="border-border flex shrink-0 items-center self-stretch border-l pl-2 sm:pl-3">
          {action}
        </div>
      ) : null}
    </div>
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
  flushX?: boolean;
  stripe?: RowStripe;
};

export function HomeFeedRowButton({
  onClick,
  ariaLabel,
  flushX = false,
  stripe,
  ...content
}: HomeFeedRowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${homeFeedRowClass(flushX, stripe)} w-full text-left`}
    >
      <HomeFeedRowContent {...content} />
    </button>
  );
}

type HomeFeedRowActionsClickProps = HomeFeedRowContentProps & {
  onRowClick: () => void;
  ariaLabel: string;
  flushX?: boolean;
  stripe?: RowStripe;
  action?: ReactNode;
};

export function HomeFeedRowActionsClick({
  onRowClick,
  ariaLabel,
  flushX = false,
  stripe,
  action,
  ...content
}: HomeFeedRowActionsClickProps) {
  return (
    <div className={homeFeedRowClass(flushX, stripe)}>
      <button
        type="button"
        onClick={onRowClick}
        aria-label={ariaLabel}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <HomeFeedRowContent {...content} hideHint={Boolean(action)} />
      </button>
      {action ? (
        <div className="border-border flex shrink-0 items-center self-stretch border-l pl-2 sm:pl-3">
          {action}
        </div>
      ) : null}
    </div>
  );
}
