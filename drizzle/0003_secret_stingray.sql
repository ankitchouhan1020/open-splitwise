ALTER TABLE "sync_state" ADD COLUMN "sync_phase" text;--> statement-breakpoint
ALTER TABLE "sync_state" ADD COLUMN "sync_progress_synced" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_state" ADD COLUMN "sync_progress_label" text;