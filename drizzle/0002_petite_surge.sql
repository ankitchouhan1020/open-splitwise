CREATE TABLE "saved_filter_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_user_id" integer NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_filter_views_account_name_unique" UNIQUE("account_user_id","name")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_filter_views" ADD CONSTRAINT "saved_filter_views_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_filter_views_account_user_id_idx" ON "saved_filter_views" USING btree ("account_user_id");--> statement-breakpoint
CREATE INDEX "expenses_fts_idx" ON "expenses" USING gin (
	to_tsvector('english', coalesce("description", '') || ' ' || coalesce("details", '') || ' ' || coalesce("search_text", ''))
);