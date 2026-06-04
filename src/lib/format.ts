/** Locales that control grouping/separators when formatting a currency amount. */
const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  NZD: "en-NZ",
  SGD: "en-SG",
  HKD: "en-HK",
  CHF: "de-CH",
  CNY: "zh-CN",
  KRW: "ko-KR",
  MXN: "es-MX",
  BRL: "pt-BR",
  AED: "en-AE",
  SAR: "ar-SA",
  THB: "th-TH",
  MYR: "ms-MY",
  IDR: "id-ID",
  PHP: "en-PH",
  VND: "vi-VN",
  PKR: "en-PK",
  BDT: "en-BD",
  LKR: "en-LK",
  NPR: "en-NP",
  ZAR: "en-ZA",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  PLN: "pl-PL",
  CZK: "cs-CZ",
  HUF: "hu-HU",
  ILS: "he-IL",
  TRY: "tr-TR",
  RUB: "ru-RU",
};

export function localeForCurrency(currency: string): string {
  return CURRENCY_LOCALES[currency.toUpperCase()] ?? "en-US";
}

export function formatAmount(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
    locale?: string;
    currency?: string;
  },
): string {
  const compact = options?.compact ?? false;
  const locale =
    options?.locale ??
    (options?.currency ? localeForCurrency(options.currency) : undefined);
  return new Intl.NumberFormat(locale, {
    ...(compact
      ? {
          notation: "compact" as const,
          maximumFractionDigits: options?.maximumFractionDigits ?? 1,
        }
      : {
          minimumFractionDigits: options?.minimumFractionDigits ?? 2,
          maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        }),
  }).format(amount);
}

export function formatMoney(
  amount: number,
  currency: string,
  options?: { compact?: boolean; locale?: string },
): string {
  const locale = options?.locale ?? localeForCurrency(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      notation: options?.compact ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `${formatAmount(amount, { locale, currency })} ${currency}`;
  }
}

export function formatPercent(value: number, signed = true): string {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(0)}%`;
}

export function formatRelativeSync(iso: string | null): string {
  if (!iso) return "Never synced";
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Synced just now";
  if (hours < 24) return `Synced ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Synced yesterday";
  return `Synced ${days} days ago`;
}
