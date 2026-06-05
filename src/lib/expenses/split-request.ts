import {
  buildEqualSplitUsersBody,
  canUseSplitEqually,
} from "@/lib/expenses/splits";
import { fetchGroupMembers } from "@/lib/groups/members";

export type GroupSplitOptions = {
  groupId: number;
  cost: string;
  ownerSplitwiseId: number;
  participantIds?: number[];
  paidByUserId?: number;
};

export async function applyGroupSplitToBody(
  body: Record<string, unknown>,
  options: GroupSplitOptions,
): Promise<{ ok: true } | { error: string }> {
  const hasCustomSplit =
    (options.participantIds?.length ?? 0) > 0 || options.paidByUserId != null;

  if (!hasCustomSplit) {
    body.split_equally = true;
    return { ok: true };
  }

  const membersResult = await fetchGroupMembers(options.groupId);
  if ("error" in membersResult) {
    return { error: membersResult.error };
  }

  const allMemberIds = membersResult.map((m) => m.id);
  const participantIds =
    options.participantIds && options.participantIds.length > 0
      ? options.participantIds
      : allMemberIds;
  const paidByUserId = options.paidByUserId ?? options.ownerSplitwiseId;

  if (
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

  try {
    Object.assign(
      body,
      buildEqualSplitUsersBody(paidByUserId, participantIds, options.cost),
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_split";
    return { error: message };
  }
}
