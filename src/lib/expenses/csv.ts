import type { ExpenseListItem } from "@/lib/expenses/types";

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function expensesToCsv(rows: ExpenseListItem[]): string {
  const header = [
    "date",
    "description",
    "details",
    "group",
    "category",
    "cost",
    "currency",
    "my_paid_share",
    "my_owed_share",
    "paid_by",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.date.slice(0, 10),
        r.description,
        r.details ?? "",
        r.groupName,
        r.categoryName ?? "",
        r.cost,
        r.currencyCode,
        r.myPaidShare ?? "",
        r.myShare ?? "",
        r.paidBy,
      ]
        .map((v) => escapeCsv(String(v)))
        .join(","),
    );
  }
  return lines.join("\n");
}

export function exportFilename(filters: {
  dateFrom?: string;
  dateTo?: string;
}): string {
  const from = filters.dateFrom?.slice(0, 10) ?? "all";
  const to = filters.dateTo?.slice(0, 10) ?? "all";
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `open-splitwise-expenses_${from}_${to}_${ts}.csv`;
}
