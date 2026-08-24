DROP INDEX "record_ranks"."organizations_slug_uidx";--> statement-breakpoint
ALTER TABLE "record_ranks"."users" ADD COLUMN "communications_agreed" boolean;--> statement-breakpoint
ALTER TABLE "record_ranks"."apikeys" ALTER COLUMN "rate_limit_max" SET DEFAULT 1000;