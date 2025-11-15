import "server-only";
import { defineRelations } from "drizzle-orm";
import { usersTable as users } from "./schema/auth-schema.ts";
import { collectiveSolutionsTable as collectiveSolutions } from "./schema/collective-solutions.ts";
import { contestsTable as contests } from "./schema/contests.ts";
import { eventsTable as events } from "./schema/events.ts";
import { personsTable as persons } from "./schema/persons.ts";
import { resultsTable as results } from "./schema/results.ts";
import { roundsTable as rounds } from "./schema/rounds.ts";

export const relations = defineRelations(
  {
    users,
    events,
    contests,
    rounds,
    results,
    persons,
    collectiveSolutions,
  },
  (r) => ({
    contests: {
      rounds: r.many.rounds(),
    },
    rounds: {
      contest: r.one.contests({
        from: r.rounds.competitionId,
        to: r.contests.competitionId,
        optional: false,
      }),
      results: r.many.results(),
    },
    results: {
      event: r.one.events({
        from: r.results.eventId,
        to: r.events.eventId,
        optional: false,
      }),
      // persons: r.many.persons({
      //   from: r.results.personIds,
      //   to: r.persons.personId,
      //   optional: false,
      // }),
      contest: r.one.contests({
        from: r.results.competitionId,
        to: r.contests.competitionId,
      }),
      round: r.one.rounds({
        from: r.results.roundId,
        to: r.rounds.roundId,
      }),
      creator: r.one.users({
        from: r.results.createdBy,
        to: r.users.id,
      }),
    },
  }),
);
