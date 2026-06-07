import type { MemberSplitInput, SplitMode } from "@/lib/expenses/split-types";
import { parseMemberSplits, parseSplitMode } from "@/lib/expenses/split-types";

export type ExpenseWriteInput = {
  description: string;
  cost: string;
  currencyCode: string;
  groupId?: number;
  friendUserId?: number;
  categoryId?: number;
  date?: string;
  details?: string;
  participantIds?: number[];
  paidByUserId?: number;
  splitMode?: SplitMode;
  memberSplits?: MemberSplitInput[];
};

export function parseExpenseWriteBody(
  data: Record<string, unknown>,
): { ok: true; input: ExpenseWriteInput } | { error: string } {
  const groupIdRaw = data.groupId;
  const friendUserIdRaw = data.friendUserId;
  const groupId =
    groupIdRaw != null && groupIdRaw !== "" ? Number(groupIdRaw) : undefined;
  const friendUserId =
    friendUserIdRaw != null && friendUserIdRaw !== ""
      ? Number(friendUserIdRaw)
      : undefined;

  const hasGroup = groupId != null && Number.isFinite(groupId) && groupId > 0;
  const hasFriend =
    friendUserId != null && Number.isFinite(friendUserId) && friendUserId > 0;

  if (hasGroup && hasFriend) {
    return { error: "group_or_friend_required" };
  }
  if (!hasGroup && !hasFriend) {
    return { error: "group_or_friend_required" };
  }

  const description = String(data.description ?? "");
  const cost = String(data.cost ?? "");
  const currencyCode = String(data.currencyCode ?? "");

  if (!description.trim() || !cost.trim() || !currencyCode.trim()) {
    return { error: "missing_fields" };
  }

  const participantIds = Array.isArray(data.participantIds)
    ? data.participantIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : undefined;

  const paidByUserId =
    data.paidByUserId != null ? Number(data.paidByUserId) : undefined;

  return {
    ok: true,
    input: {
      description,
      cost,
      currencyCode,
      groupId: hasGroup ? groupId : undefined,
      friendUserId: hasFriend ? friendUserId : undefined,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      date: data.date ? String(data.date) : undefined,
      details: data.details ? String(data.details) : undefined,
      participantIds,
      paidByUserId:
        paidByUserId != null && Number.isFinite(paidByUserId)
          ? paidByUserId
          : undefined,
      splitMode: parseSplitMode(data.splitMode),
      memberSplits: parseMemberSplits(data.memberSplits),
    },
  };
}

export type SettlementWriteInput = {
  friendUserId: number;
  cost: string;
  currencyCode: string;
  payerUserId: number;
  payeeUserId: number;
  description?: string;
  date?: string;
  details?: string;
  groupId?: number;
};

export function parseSettlementWriteBody(
  data: Record<string, unknown>,
): { ok: true; input: SettlementWriteInput } | { error: string } {
  const friendUserId = Number(data.friendUserId);
  const payerUserId = Number(data.payerUserId);
  const payeeUserId = Number(data.payeeUserId);
  const cost = String(data.cost ?? "");
  const currencyCode = String(data.currencyCode ?? "");

  if (
    !Number.isFinite(friendUserId) ||
    friendUserId <= 0 ||
    !Number.isFinite(payerUserId) ||
    payerUserId <= 0 ||
    !Number.isFinite(payeeUserId) ||
    payeeUserId <= 0
  ) {
    return { error: "missing_fields" };
  }

  if (!cost.trim() || !currencyCode.trim()) {
    return { error: "missing_fields" };
  }

  const groupIdRaw = data.groupId;
  const groupId =
    groupIdRaw != null && groupIdRaw !== "" ? Number(groupIdRaw) : undefined;

  return {
    ok: true,
    input: {
      friendUserId,
      payerUserId,
      payeeUserId,
      cost,
      currencyCode,
      description: data.description ? String(data.description) : undefined,
      date: data.date ? String(data.date) : undefined,
      details: data.details ? String(data.details) : undefined,
      groupId:
        groupId != null && Number.isFinite(groupId) && groupId > 0
          ? groupId
          : undefined,
    },
  };
}

export function parseExpenseUpdateBody(
  data: Record<string, unknown>,
):
  | { ok: true; input: Omit<ExpenseWriteInput, "groupId" | "friendUserId"> }
  | { error: string } {
  const description = String(data.description ?? "");
  const cost = String(data.cost ?? "");
  const currencyCode = String(data.currencyCode ?? "");

  if (!description.trim() || !cost.trim() || !currencyCode.trim()) {
    return { error: "missing_fields" };
  }

  const participantIds = Array.isArray(data.participantIds)
    ? data.participantIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : undefined;

  const paidByUserId =
    data.paidByUserId != null ? Number(data.paidByUserId) : undefined;

  return {
    ok: true,
    input: {
      description,
      cost,
      currencyCode,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      date: data.date ? String(data.date) : undefined,
      details: data.details ? String(data.details) : undefined,
      participantIds,
      paidByUserId:
        paidByUserId != null && Number.isFinite(paidByUserId)
          ? paidByUserId
          : undefined,
      splitMode: parseSplitMode(data.splitMode),
      memberSplits: parseMemberSplits(data.memberSplits),
    },
  };
}
