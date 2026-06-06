export type SmartFilterExampleInput = {
  groups: Array<{ groupName: string }>;
  topCategories: Array<{ categoryName: string }>;
  friends: Array<{ name: string }>;
};

export function buildSmartFilterExamples(
  input: SmartFilterExampleInput,
  limit = 3,
): string[] {
  const examples: string[] = [];

  const topGroup = input.groups[0];
  if (topGroup) {
    examples.push(`${topGroup.groupName} this month`);
  }

  const topCategory = input.topCategories[0];
  if (topCategory) {
    examples.push(`${topCategory.categoryName} last 30 days`);
  }

  const friend = input.friends[0];
  if (friend) {
    examples.push(`How much with ${friend.name} this year?`);
  }

  if (examples.length > 0) {
    return examples.slice(0, limit);
  }

  return ["This month", "Last 30 days", "Settlements"];
}
