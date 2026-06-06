CREATE TABLE "user_ai_settings" (
	"account_user_id" integer PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"provider" text DEFAULT 'openai' NOT NULL,
	"base_url" text,
	"model" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"encrypted_api_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
