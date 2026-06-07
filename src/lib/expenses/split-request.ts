import {
  buildCustomSplitUsersBody,
  buildEqualSplitUsersBody,
  canUseSplitEqually,
} from "@/lib/expenses/splits";
import type { MemberSplitInput, SplitMode } from "@/lib/expenses/split-types";
import { fetchGroupMembers } from "@/lib/groups/members";

export type ApplySplitOptions = {
  cost: string;
  ownerSplitwiseId: number;
  groupId?: number;
  friendUserId?: number;
  participantIds?: number[];
  paidByUserId?: number;
  splitMode?: SplitMode;
  memberSplits?: MemberSplitInput[];
};

function resolveParticipants(options: ApplySplitOptions): number[] {
  if (options.participantIds && options.participantIds.length > 0) {
    return [...new Set(options.participantIds)];
  }
  if (options.friendUserId) {
    return [options.ownerSplitwiseId, options.friendUserId];
  }
  return [];
}

function assignSplitBody(
  body: Record<string, unknown>,
  paidByUserId: number,
  participantIds: number[],
  cost: string,
  splitMode: SplitMode,
  memberSplits?: MemberSplitInput[],
): { ok: true } | { error: string } {
  try {
    if (splitMode !== "equal" && memberSplits?.length) {
      Object.assign(
        body,
        buildCustomSplitUsersBody(
          paidByUserId,
          participantIds,
          cost,
          splitMode,
          memberSplits,
        ),
      );
      return { ok: true };
    }

    Object.assign(
      body,
      buildEqualSplitUsersBody(paidByUserId, participantIds, cost),
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_split";
    return { error: message };
  }
}

export async function applySplitToBody(
  body: Record<string, unknown>,
  options: ApplySplitOptions,
): Promise<{ ok: true } | { error: string }> {
  const splitMode = options.splitMode ?? "equal";
  const paidByUserId = options.paidByUserId ?? options.ownerSplitwiseId;
  const hasCustomParticipants =
    (options.participantIds?.length ?? 0) > 0 ||
    options.paidByUserId != null ||
    splitMode !== "equal" ||
    (options.memberSplits?.length ?? 0) > 0;

  if (!hasCustomParticipants && options.groupId) {
    body.split_equally = true;
    return { ok: true };
  }

  if (!hasCustomParticipants && options.friendUserId) {
    return assignSplitBody(
      body,
      paidByUserId,
      [options.ownerSplitwiseId, options.friendUserId],
      options.cost,
      "equal",
    );
  }

  if (options.groupId) {
    const membersResult = await fetchGroupMembers(options.groupId);
    if ("error" in membersResult) {
      return { error: membersResult.error };
    }

    const allMemberIds = membersResult.map((m) => m.id);
    const participantIds = resolveParticipants(options);
    if (participantIds.length === 0) {
      return { error: "participants_required" };
    }

    if (
      splitMode === "equal" &&
      canUseSplitEqually(
        allMemberIds,
        participantIds,
        paidByUserId,
        options.ownerSplitwiseId,
      )
    ) {
      body.split_equally = true;
      return { ok: true };
    }

    return assignSplitBody(
      body,
      paidByUserId,
      participantIds,
      options.cost,
      splitMode,
      options.memberSplits,
    );
  }

  const participantIds = resolveParticipants(options);
  if (participantIds.length === 0) {
    return { error: "participants_required" };
  }

  return assignSplitBody(
    body,
    paidByUserId,
    participantIds,
    options.cost,
    splitMode,
    options.memberSplits,
  );
}

/** @deprecated Use applySplitToBody */
export async function applyGroupSplitToBody(
  body: Record<string, unknown>,
  options: {
    groupId: number;
    cost: string;
    ownerSplitwiseId: number;
    participantIds?: number[];
    paidByUserId?: number;
  },
): Promise<{ ok: true } | { error: string }> {
  return applySplitToBody(body, options);
}
