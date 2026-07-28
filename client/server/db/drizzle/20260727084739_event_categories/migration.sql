CREATE TABLE "record_ranks"."event_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "record_ranks"."event_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" text NOT NULL,
	"category_id" text NOT NULL,
	"rank" integer NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"description" text,
	"color" varchar(7) NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"video_based" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_event_categories_category_id" UNIQUE("organization_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "record_ranks"."event_categories" ADD CONSTRAINT "event_categories_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "record_ranks"."organizations"("id") ON DELETE CASCADE;
--> statement-breakpoint
-- CUSTOM ADDITION FOR RECORDRANKS: {
-- Generate categories for each organization based on existing events.category values
INSERT INTO "record_ranks"."event_categories" ("organization_id", "category_id", "rank", "name", "color", "hidden", "video_based")
SELECT
  org_cat."organization_id",
  org_cat."category",
  10 * ROW_NUMBER() OVER (PARTITION BY org_cat."organization_id" ORDER BY org_cat."category") AS rank,
  INITCAP(org_cat."category"),
  '#ffffff',
  CASE WHEN org_cat."category" = 'removed' THEN true ELSE false END,
  CASE WHEN org_cat."category" = 'extreme-bld' THEN true ELSE false END
FROM (
  SELECT DISTINCT
    e."organization_id",
    e."category"
  FROM "record_ranks"."events" e
) org_cat;
-- Add category_id column as nullable first
ALTER TABLE "record_ranks"."events" ADD COLUMN "category_id" integer;
-- Populate category_id from the newly created event categories
UPDATE "record_ranks"."events" e
SET "category_id" = ec."id"
FROM "record_ranks"."event_categories" ec
WHERE ec."organization_id" = e."organization_id" AND ec."category_id" = e."category";
-- Now make it NOT NULL
ALTER TABLE "record_ranks"."events" ALTER COLUMN "category_id" SET NOT NULL;
-- }
--> statement-breakpoint
ALTER TABLE "record_ranks"."events" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "record_ranks"."events" ADD CONSTRAINT "events_category_id_event_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "record_ranks"."event_categories"("id");--> statement-breakpoint
DROP TYPE "record_ranks"."event_category";