/** How owed amounts are derived when building Splitwise user shares. */
export type SplitMode = "equal" | "exact" | "percent" | "shares";

export type MemberSplitInput = {
  userId: number;
  /** Exact owed amount, percent (0–100), or share count depending on mode. */
  value: string;
};

export const SPLIT_MODE_LABELS: Record<SplitMode, string> = {
  equal: "Equally",
  exact: "Exact amounts",
  percent: "By percentage",
  shares: "By shares",
};

export function parseSplitMode(value: unknown): SplitMode {
  if (
    value === "exact" ||
    value === "percent" ||
    value === "shares" ||
    value === "equal"
  ) {
    return value;
  }
  return "equal";
}

export function parseMemberSplits(
  value: unknown,
): MemberSplitInput[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: MemberSplitInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const userId = Number(row.userId);
    const v = String(row.value ?? "").trim();
    if (Number.isFinite(userId) && userId > 0 && v) {
      out.push({ userId, value: v });
    }
  }
  return out.length > 0 ? out : undefined;
}
