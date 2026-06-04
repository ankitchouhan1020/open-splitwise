import { requireAccessToken } from "@/lib/auth";
import { createSplitwiseClient } from "@/lib/splitwise/client";
import type {
  SplitwiseGroupDetailResponse,
  SplitwiseGroupMember,
} from "@/lib/splitwise/types";

export type GroupMember = {
  id: number;
  name: string;
};

function memberName(member: SplitwiseGroupMember): string {
  const parts = [member.first_name, member.last_name].filter(Boolean);
  return parts.join(" ").trim() || member.email || `User ${member.id}`;
}

export async function fetchGroupMembers(
  groupId: number,
): Promise<GroupMember[] | { error: string }> {
  const token = await requireAccessToken();
  const client = createSplitwiseClient(token);

  const data = await client.get<SplitwiseGroupDetailResponse>(
    `get_group/${groupId}`,
  );
  const members = data.group?.members ?? [];

  return members.map((m) => ({
    id: m.id,
    name: memberName(m),
  }));
}
