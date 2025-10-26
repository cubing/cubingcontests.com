import { defineRelations } from "drizzle-orm";
import { usersTable as users } from "./schema/auth-schema.ts";
import { collectiveSolutionsTable as collectiveSolutions } from "./schema/collective-solutions.ts";
import { eventsTable as events } from "./schema/events.ts";
import { personsTable as persons } from "./schema/persons.ts";
import { resultsTable as results } from "./schema/results.ts";

export const relations = defineRelations({
  users,
  collectiveSolutions,
  events,
  persons,
  results,
}, (r) => ({
  results: {
    event: r.one.events({
      from: r.results.eventId,
      to: r.events.eventId,
      optional: false,
    }),
    persons: r.many.persons({
      from: r.results.personIds,
      to: r.persons.personId,
    }),
    creator: r.one.users({
      from: r.results.createdBy,
      to: r.users.id,
    }),
  },
}));
