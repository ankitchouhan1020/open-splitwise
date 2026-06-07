ALTER TABLE "groups" ADD COLUMN "simplify_by_default" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "owner_net_balance" numeric(14, 2);
--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "owner_net_balance_currency" text;
--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "balances_synced_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE "group_debts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_user_id" integer NOT NULL,
	"group_splitwise_id" bigint NOT NULL,
	"from_user_id" bigint NOT NULL,
	"to_user_id" bigint NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency_code" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_user_id" integer NOT NULL,
	"group_splitwise_id" bigint NOT NULL,
	"splitwise_user_id" bigint NOT NULL,
	"name" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_debts" ADD CONSTRAINT "group_debts_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "group_debts_unique" ON "group_debts" USING btree ("account_user_id","group_splitwise_id","from_user_id","to_user_id","currency_code");
--> statement-breakpoint
CREATE INDEX "group_debts_account_group_idx" ON "group_debts" USING btree ("account_user_id","group_splitwise_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_unique" ON "group_members" USING btree ("account_user_id","group_splitwise_id","splitwise_user_id");
--> statement-breakpoint
CREATE INDEX "group_members_account_group_idx" ON "group_members" USING btree ("account_user_id","group_splitwise_id");
