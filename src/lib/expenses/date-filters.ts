/** Local calendar-day helpers for expense filter date inputs. */

export function parseLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function formatLocalDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Map stored filter ISO to a `<input type="date">` value (local calendar day). */
export function expenseDateInputValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return formatLocalDateInput(d);
}

export function localDayStartIso(date: Date): string {
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
  return d.toISOString();
}

export function localDayEndIso(date: Date): string {
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
  return d.toISOString();
}

/** Start of local calendar day for `dateFrom` filters. */
export function expenseDateFromIso(localDate: string): string | undefined {
  const d = parseLocalDateString(localDate);
  if (!d) return undefined;
  return localDayStartIso(d);
}

/** End of local calendar day for `dateTo` filters. */
export function expenseDateToIso(localDate: string): string | undefined {
  const d = parseLocalDateString(localDate);
  if (!d) return undefined;
  return localDayEndIso(d);
}

export function formatExpenseDateRangeLabel(
  dateFrom?: string,
  dateTo?: string,
): string {
  const from = dateFrom ? expenseDateInputValue(dateFrom) : "…";
  const to = dateTo ? expenseDateInputValue(dateTo) : "…";
  return `${from} – ${to}`;
}
