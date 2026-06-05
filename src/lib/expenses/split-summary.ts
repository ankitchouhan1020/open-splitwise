type ShareLike = {
  paidShare: string;
  owedShare: string;
};

const EPS = 0.005;

export type SplitSummary = {
  participantCount: number;
  payerCount: number;
  mode: "equal" | "unequal" | "none";
  headline: string;
  detail: string;
};

export function describeSplitFromShares(shares: ShareLike[]): SplitSummary {
  const participants = shares.filter(
    (s) =>
      Number(s.paidShare) > EPS ||
      Number(s.owedShare) > EPS ||
      Number(s.paidShare) < -EPS,
  );
  const owed = shares.filter((s) => Number(s.owedShare) > EPS);
  const payers = shares.filter((s) => Number(s.paidShare) > EPS);

  if (owed.length === 0) {
    return {
      participantCount: participants.length,
      payerCount: payers.length,
      mode: "none",
      headline: "No active split",
      detail: "Everyone is settled on this expense.",
    };
  }

  const owedAmounts = owed.map((s) => Number(s.owedShare));
  const first = owedAmounts[0] ?? 0;
  const equal =
    owedAmounts.length > 0 &&
    owedAmounts.every((a) => Math.abs(a - first) < 0.01);

  const mode = equal ? "equal" : "unequal";
  const payerPart =
    payers.length > 1
      ? `${payers.length} people paid`
      : payers.length === 1
        ? "1 person paid"
        : "No payer recorded";

  const splitPart = equal
    ? `Equal · ${owed.length} ${owed.length === 1 ? "person" : "people"}`
    : `Custom amounts · ${owed.length} ${owed.length === 1 ? "person" : "people"}`;

  return {
    participantCount: participants.length,
    payerCount: payers.length,
    mode,
    headline: splitPart,
    detail: payerPart,
  };
}
