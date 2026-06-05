import { and, asc, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getAuthenticatedAccountOwner } from "@/lib/db/account";
import { filtersFromJson, type ExpenseFilters } from "@/lib/expenses/filters";

const MAX_VIEWS = 20;

export async function listSavedViews(): Promise<
  Array<{ id: number; name: string; filters: ExpenseFilters }>
> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return [];

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.savedFilterViews)
    .where(eq(schema.savedFilterViews.accountUserId, owner.id))
    .orderBy(asc(schema.savedFilterViews.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    filters: filtersFromJson(r.filters),
  }));
}

export async function createSavedView(
  name: string,
  filters: ExpenseFilters,
): Promise<{ id: number; name: string } | { error: string }> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "name_required" };

  const db = getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.savedFilterViews)
    .where(eq(schema.savedFilterViews.accountUserId, owner.id));

  if (total >= MAX_VIEWS) {
    return { error: "max_views_reached" };
  }

  const [row] = await db
    .insert(schema.savedFilterViews)
    .values({
      accountUserId: owner.id,
      name: trimmed,
      filters,
    })
    .returning({
      id: schema.savedFilterViews.id,
      name: schema.savedFilterViews.name,
    });

  return { id: row.id, name: row.name };
}

export async function updateSavedView(
  id: number,
  patch: { name?: string; filters?: ExpenseFilters },
): Promise<{ ok: true } | { error: string }> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  const db = getDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name?.trim()) updates.name = patch.name.trim();
  if (patch.filters) updates.filters = patch.filters;

  await db
    .update(schema.savedFilterViews)
    .set(updates)
    .where(
      and(
        eq(schema.savedFilterViews.id, id),
        eq(schema.savedFilterViews.accountUserId, owner.id),
      ),
    );

  return { ok: true };
}

export async function deleteSavedView(
  id: number,
): Promise<{ ok: true } | { error: string }> {
  const owner = await getAuthenticatedAccountOwner();
  if (!owner) return { error: "not_connected" };

  const db = getDb();
  await db
    .delete(schema.savedFilterViews)
    .where(
      and(
        eq(schema.savedFilterViews.id, id),
        eq(schema.savedFilterViews.accountUserId, owner.id),
      ),
    );

  return { ok: true };
}
