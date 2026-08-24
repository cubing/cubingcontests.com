ALTER TABLE "record_ranks"."contests" ALTER COLUMN "venue" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "record_ranks"."contests" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "record_ranks"."contests" ALTER COLUMN "competitor_limit" DROP NOT NULL;
-- CUSTOM ADDITION FOR RECORDRANKS!
UPDATE "record_ranks"."contests" SET "venue" = NULL WHERE "venue" = '';
UPDATE "record_ranks"."contests" SET "address" = NULL WHERE "address" = '';