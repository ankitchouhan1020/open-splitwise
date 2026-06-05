"use client";

import { useMemo } from "react";
import { useCategoryIconMap } from "@/lib/query/hooks";
import {
  PAYMENT_ICON_COLORS,
  resolveCategoryIcon,
  type CategoryIconStyle,
} from "@/lib/splitwise/category-icon";

/** Splitwise "General" — receipt-style fallback when no category is set. */
const DEFAULT_CATEGORY_ID = 18;

type Props = {
  categoryId?: number | null;
  categoryName?: string | null;
  categoryIconUrl?: string | null;
  categoryIconBg?: string | null;
  payment?: boolean;
  className?: string;
};

/** Shared square tile — matches Splitwise list icon shape. */
const ICON_TILE =
  "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[5px]";

function PaymentIcon({ className }: { className?: string }) {
  return (
    <span
      className={`${ICON_TILE} text-base font-bold ${className ?? ""}`}
      style={{
        backgroundColor: PAYMENT_ICON_COLORS.backgroundColor,
        color: PAYMENT_ICON_COLORS.foregroundColor,
      }}
      aria-hidden
    >
      $
    </span>
  );
}

function SplitwiseIconTile({
  style,
  label,
  className,
}: {
  style: CategoryIconStyle;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`${ICON_TILE} ${className ?? ""}`}
      style={{ backgroundColor: style.backgroundColor }}
      title={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Splitwise CDN icons */}
      <img
        src={style.iconUrl}
        alt=""
        className={
          style.fullBleed
            ? "h-full w-full object-cover"
            : "h-7 w-7 object-contain"
        }
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function ExpenseCategoryIcon({
  categoryId,
  categoryName,
  categoryIconUrl,
  categoryIconBg,
  payment = false,
  className = "",
}: Props) {
  const { data: iconMap } = useCategoryIconMap();

  const style = useMemo(() => {
    if (payment) return null;

    if (categoryIconUrl && categoryIconBg) {
      return {
        iconUrl: categoryIconUrl,
        backgroundColor: categoryIconBg,
        fullBleed: categoryIconUrl.includes("/square"),
      } satisfies CategoryIconStyle;
    }

    return (
      resolveCategoryIcon(categoryId, null, iconMap) ??
      resolveCategoryIcon(DEFAULT_CATEGORY_ID, null, iconMap)
    );
  }, [categoryId, categoryIconUrl, categoryIconBg, iconMap, payment]);

  if (payment) {
    return <PaymentIcon className={className} />;
  }

  const label = categoryName?.trim() || "General";

  if (style) {
    return (
      <SplitwiseIconTile style={style} label={label} className={className} />
    );
  }

  return (
    <span
      className={`${ICON_TILE} bg-muted-surface ${className}`}
      title={label}
      aria-hidden
    >
      <svg
        className="text-muted h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 14h6M9 10h6M7 4h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z"
        />
      </svg>
    </span>
  );
}
