CREATE TYPE "record_ranks"."h2h_winner" AS ENUM('1', '2', 'draw');--> statement-breakpoint
ALTER TYPE "record_ranks"."event_format" ADD VALUE 'h2h';--> statement-breakpoint
ALTER TYPE "record_ranks"."round_format" ADD VALUE 'h2h';--> statement-breakpoint
CREATE TABLE "record_ranks"."matches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "record_ranks"."matches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" text NOT NULL,
	"competition_id" text NOT NULL,
	"event_id" text NOT NULL,
	"round_id" integer NOT NULL,
	"bracket_number" integer NOT NULL,
	"stage" integer NOT NULL,
	"position" integer NOT NULL,
	"sets_to_win_match" integer NOT NULL,
	"attempts_to_win_set" integer NOT NULL,
	"team1" jsonb NOT NULL,
	"team2" jsonb NOT NULL,
	"open" boolean DEFAULT false NOT NULL,
	"winner" "record_ranks"."h2h_winner",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_matches" UNIQUE("organization_id","competition_id","round_id","bracket_number","stage","position")
);
--> statement-breakpoint
CREATE TABLE "record_ranks"."sets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "record_ranks"."sets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" text NOT NULL,
	"competition_id" text NOT NULL,
	"event_id" text NOT NULL,
	"round_id" integer NOT NULL,
	"bracket_number" integer NOT NULL,
	"match_id" integer NOT NULL,
	"attempt_winners" "record_ranks"."h2h_winner"[] DEFAULT '{}'::"record_ranks"."h2h_winner"[] NOT NULL,
	"result1" integer,
	"result2" integer,
	"set_winner" "record_ranks"."h2h_winner",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "record_ranks"."rounds" ADD COLUMN "brackets" jsonb[];--> statement-breakpoint
ALTER TABLE "record_ranks"."matches" ADD CONSTRAINT "matches_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "record_ranks"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."matches" ADD CONSTRAINT "matches_round_id_rounds_id_fkey" FOREIGN KEY ("round_id") REFERENCES "record_ranks"."rounds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."matches" ADD CONSTRAINT "matches_competition_id_fk" FOREIGN KEY ("organization_id","competition_id") REFERENCES "record_ranks"."contests"("organization_id","competition_id") ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."matches" ADD CONSTRAINT "matches_event_id_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "record_ranks"."events"("organization_id","event_id") ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "record_ranks"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_round_id_rounds_id_fkey" FOREIGN KEY ("round_id") REFERENCES "record_ranks"."rounds"("id");--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_match_id_matches_id_fkey" FOREIGN KEY ("match_id") REFERENCES "record_ranks"."matches"("id");--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_result1_results_id_fkey" FOREIGN KEY ("result1") REFERENCES "record_ranks"."results"("id");--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_result2_results_id_fkey" FOREIGN KEY ("result2") REFERENCES "record_ranks"."results"("id");--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_competition_id_fk" FOREIGN KEY ("organization_id","competition_id") REFERENCES "record_ranks"."contests"("organization_id","competition_id") ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."sets" ADD CONSTRAINT "sets_event_id_fk" FOREIGN KEY ("organization_id","event_id") REFERENCES "record_ranks"."events"("organization_id","event_id") ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "record_ranks"."rounds" ADD CONSTRAINT "rounds_brackets_check" CHECK ("brackets" IS NULL OR "format" = 'h2h');