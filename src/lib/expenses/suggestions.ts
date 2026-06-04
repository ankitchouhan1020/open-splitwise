import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";

export type ExpenseSuggestions = {
  defaultCurrency: string;
  descriptions: string[];
  groups: Array<{ id: number; name: string; count: number }>;
  categories: Array<{ id: number; name: string; count: number }>;
};

export async function getExpenseSuggestions(): Promise<ExpenseSuggestions | null> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return null;

  const db = getDb();
  const baseWhere = and(
    eq(schema.expenses.accountUserId, owner.id),
    isNull(schema.expenses.deletedAt),
    eq(schema.expenses.payment, false),
  );

  const [descriptions, groups, categories] = await Promise.all([
    db
      .select({
        description: schema.expenses.description,
        lastUsed: sql<Date>`max(${schema.expenses.date})`,
      })
      .from(schema.expenses)
      .where(baseWhere)
      .groupBy(schema.expenses.description)
      .orderBy(sql`max(${schema.expenses.date}) desc`)
      .limit(40),
    db
      .select({
        id: schema.expenses.groupId,
        name: schema.groups.name,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.expenses)
      .leftJoin(
        schema.groups,
        and(
          eq(schema.groups.splitwiseId, schema.expenses.groupId),
          eq(schema.groups.accountUserId, owner.id),
        ),
      )
      .where(and(baseWhere, sql`${schema.expenses.groupId} > 0`))
      .groupBy(schema.expenses.groupId, schema.groups.name)
      .orderBy(sql`count(*) desc`)
      .limit(12),
    db
      .select({
        id: schema.expenses.categoryId,
        name: schema.categories.name,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.expenses)
      .leftJoin(
        schema.categories,
        eq(schema.categories.splitwiseId, schema.expenses.categoryId),
      )
      .where(and(baseWhere, sql`${schema.expenses.categoryId} IS NOT NULL`))
      .groupBy(schema.expenses.categoryId, schema.categories.name)
      .orderBy(sql`count(*) desc`)
      .limit(12),
  ]);

  return {
    defaultCurrency: owner.defaultCurrency,
    descriptions: descriptions.map((d) => d.description).filter(Boolean),
    groups: groups
      .filter((g) => g.id != null && g.id > 0)
      .map((g) => ({
        id: g.id!,
        name: g.name ?? `Group #${g.id}`,
        count: g.count,
      })),
    categories: categories
      .filter((c) => c.id != null)
      .map((c) => ({
        id: c.id!,
        name: c.name ?? `Category #${c.id}`,
        count: c.count,
      })),
  };
}
