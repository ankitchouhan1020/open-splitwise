ALTER TABLE "categories" ALTER COLUMN "splitwise_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "parent_splitwise_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "expense_shares" ALTER COLUMN "splitwise_user_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "splitwise_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "group_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "friendship_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "category_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "friends" ALTER COLUMN "splitwise_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "splitwise_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "splitwise_id" SET DATA TYPE bigint;