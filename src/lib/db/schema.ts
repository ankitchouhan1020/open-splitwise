import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/** Splitwise API ids can exceed int32; store as bigint. */
const splitwiseId = (name: string) => bigint(name, { mode: "number" });

/** Connected Splitwise account (owner of synced data). */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    splitwiseId: splitwiseId("splitwise_id").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    defaultCurrency: text("default_currency").notNull(),
    isAccountOwner: boolean("is_account_owner").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("users_splitwise_id_unique").on(table.splitwiseId)],
);

export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    accountUserId: integer("account_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    splitwiseId: splitwiseId("splitwise_id").notNull(),
    name: text("name").notNull(),
    groupType: text("group_type"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    raw: jsonb("raw").notNull().default({}),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("groups_account_splitwise_unique").on(
      table.accountUserId,
      table.splitwiseId,
    ),
    index("groups_account_user_id_idx").on(table.accountUserId),
  ],
);

export const friends = pgTable(
  "friends",
  {
    id: serial("id").primaryKey(),
    accountUserId: integer("account_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    splitwiseId: splitwiseId("splitwise_id").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    raw: jsonb("raw").notNull().default({}),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("friends_account_splitwise_unique").on(
      table.accountUserId,
      table.splitwiseId,
    ),
    index("friends_account_user_id_idx").on(table.accountUserId),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    splitwiseId: splitwiseId("splitwise_id").notNull(),
    name: text("name").notNull(),
    parentSplitwiseId: splitwiseId("parent_splitwise_id"),
    raw: jsonb("raw").notNull().default({}),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("categories_splitwise_id_unique").on(table.splitwiseId)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    accountUserId: integer("account_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    splitwiseId: splitwiseId("splitwise_id").notNull(),
    groupId: splitwiseId("group_id"),
    friendshipId: splitwiseId("friendship_id"),
    cost: numeric("cost", { precision: 14, scale: 2 }).notNull(),
    currencyCode: text("currency_code").notNull(),
    categoryId: splitwiseId("category_id"),
    description: text("description").notNull(),
    details: text("details"),
    /** Extra searchable text (e.g. synced comment bodies). */
    searchText: text("search_text").notNull().default(""),
    date: timestamp("date", { withTimezone: true }).notNull(),
    payment: boolean("payment").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    raw: jsonb("raw").notNull().default({}),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("expenses_account_splitwise_unique").on(
      table.accountUserId,
      table.splitwiseId,
    ),
    index("expenses_account_user_id_idx").on(table.accountUserId),
    index("expenses_date_idx").on(table.date),
    index("expenses_group_id_idx").on(table.groupId),
    index("expenses_category_id_idx").on(table.categoryId),
  ],
);

export const expenseShares = pgTable(
  "expense_shares",
  {
    id: serial("id").primaryKey(),
    expenseId: integer("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    splitwiseUserId: splitwiseId("splitwise_user_id").notNull(),
    paidShare: numeric("paid_share", { precision: 14, scale: 2 }).notNull(),
    owedShare: numeric("owed_share", { precision: 14, scale: 2 }).notNull(),
    netBalance: numeric("net_balance", { precision: 14, scale: 2 }),
  },
  (table) => [
    unique("expense_shares_expense_user_unique").on(
      table.expenseId,
      table.splitwiseUserId,
    ),
    index("expense_shares_expense_id_idx").on(table.expenseId),
  ],
);

export const savedFilterViews = pgTable(
  "saved_filter_views",
  {
    id: serial("id").primaryKey(),
    accountUserId: integer("account_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    filters: jsonb("filters").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("saved_filter_views_account_name_unique").on(
      table.accountUserId,
      table.name,
    ),
    index("saved_filter_views_account_user_id_idx").on(table.accountUserId),
  ],
);

export const syncState = pgTable("sync_state", {
  accountUserId: integer("account_user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  expensesLastSyncAt: timestamp("expenses_last_sync_at", {
    withTimezone: true,
  }),
  expensesUpdatedAfter: timestamp("expenses_updated_after", {
    withTimezone: true,
  }),
  expensesStatus: text("expenses_status").notNull().default("idle"),
  expensesError: text("expenses_error"),
  expenseCount: integer("expense_count").notNull().default(0),
  syncPhase: text("sync_phase"),
  syncProgressSynced: integer("sync_progress_synced").notNull().default(0),
  syncProgressLabel: text("sync_progress_label"),
  groupsLastSyncAt: timestamp("groups_last_sync_at", { withTimezone: true }),
  friendsLastSyncAt: timestamp("friends_last_sync_at", { withTimezone: true }),
  categoriesLastSyncAt: timestamp("categories_last_sync_at", {
    withTimezone: true,
  }),
});

export type User = typeof users.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ExpenseShare = typeof expenseShares.$inferSelect;
export type SyncState = typeof syncState.$inferSelect;
