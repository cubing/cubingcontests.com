CREATE TABLE "record_ranks"."member_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "record_ranks"."member_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"member_id" text NOT NULL UNIQUE,
	"requested_role" text,
	"requested_person_id" integer,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "record_ranks"."persons" DROP CONSTRAINT "persons_member_id_members_id_fkey";--> statement-breakpoint
DROP TABLE "record_ranks"."user_requests";--> statement-breakpoint
ALTER TABLE "record_ranks"."members" ADD COLUMN "person_id" integer;--> statement-breakpoint
ALTER TABLE "record_ranks"."persons" DROP COLUMN "member_id";--> statement-breakpoint
ALTER TABLE "record_ranks"."members" ADD CONSTRAINT "members_person_id_key" UNIQUE("person_id");--> statement-breakpoint
ALTER TABLE "record_ranks"."member_requests" ADD CONSTRAINT "member_requests_member_id_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "record_ranks"."members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."member_requests" ADD CONSTRAINT "member_requests_requested_person_id_persons_id_fkey" FOREIGN KEY ("requested_person_id") REFERENCES "record_ranks"."persons"("id") ON DELETE CASCADE;--> statement-breakpoint
UPDATE "record_ranks"."settings" SET "key" = 'member-request-instructions' WHERE "key" = 'user-request-instructions';--> statement-breakpoint

-- CUSTOM ADDITION FOR RECORDRANKS!
INSERT INTO "record_ranks"."organizations" ("id", "name", "slug", "created_at", "metadata") VALUES
  ('default', 'Default Organization', 'default', NOW(), '{"private":false,"contactEmail":"","showDonationLinks":true}');
--> statement-breakpoint
INSERT INTO "record_ranks"."members" ("id", "organization_id", "user_id", "role", "created_at", "person_id")
SELECT
  CONCAT('migrated_', "id") AS "id",
  'default' AS "organization_id",
  "id" AS "user_id",
  CASE WHEN "role" LIKE '%user%' THEN 'member' ELSE "role" END AS "role",
  "created_at",
  "person_id"
FROM "record_ranks"."users";
--> statement-breakpoint
UPDATE "record_ranks"."users" SET "role" = 'user' WHERE "role" <> 'admin';
--> statement-breakpoint
ALTER TABLE "record_ranks"."users" DROP COLUMN "person_id";