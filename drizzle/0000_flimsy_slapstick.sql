CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"splitwise_id" integer NOT NULL,
	"name" text NOT NULL,
	"parent_splitwise_id" integer,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_splitwise_id_unique" UNIQUE("splitwise_id")
);
--> statement-breakpoint
CREATE TABLE "expense_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_id" integer NOT NULL,
	"splitwise_user_id" integer NOT NULL,
	"paid_share" numeric(14, 2) NOT NULL,
	"owed_share" numeric(14, 2) NOT NULL,
	"net_balance" numeric(14, 2),
	CONSTRAINT "expense_shares_expense_user_unique" UNIQUE("expense_id","splitwise_user_id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_user_id" integer NOT NULL,
	"splitwise_id" integer NOT NULL,
	"group_id" integer,
	"friendship_id" integer,
	"cost" numeric(14, 2) NOT NULL,
	"currency_code" text NOT NULL,
	"category_id" integer,
	"description" text NOT NULL,
	"details" text,
	"date" timestamp with time zone NOT NULL,
	"payment" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_account_splitwise_unique" UNIQUE("account_user_id","splitwise_id")
);
--> statement-breakpoint
CREATE TABLE "friends" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_user_id" integer NOT NULL,
	"splitwise_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"updated_at" timestamp with time zone,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friends_account_splitwise_unique" UNIQUE("account_user_id","splitwise_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_user_id" integer NOT NULL,
	"splitwise_id" integer NOT NULL,
	"name" text NOT NULL,
	"group_type" text,
	"updated_at" timestamp with time zone,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_account_splitwise_unique" UNIQUE("account_user_id","splitwise_id")
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"account_user_id" integer PRIMARY KEY NOT NULL,
	"expenses_last_sync_at" timestamp with time zone,
	"expenses_updated_after" timestamp with time zone,
	"expenses_status" text DEFAULT 'idle' NOT NULL,
	"expenses_error" text,
	"expense_count" integer DEFAULT 0 NOT NULL,
	"groups_last_sync_at" timestamp with time zone,
	"friends_last_sync_at" timestamp with time zone,
	"categories_last_sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"splitwise_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"default_currency" text NOT NULL,
	"is_account_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_splitwise_id_unique" UNIQUE("splitwise_id")
);
--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_shares_expense_id_idx" ON "expense_shares" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expenses_account_user_id_idx" ON "expenses" USING btree ("account_user_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "expenses_group_id_idx" ON "expenses" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "friends_account_user_id_idx" ON "friends" USING btree ("account_user_id");--> statement-breakpoint
CREATE INDEX "groups_account_user_id_idx" ON "groups" USING btree ("account_user_id");