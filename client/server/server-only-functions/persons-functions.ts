import "server-only";
import { sql } from "drizzle-orm";
import type { RecordCategory } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import { eventCategoriesTable } from "~/server/db/schema/event-categories.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { resultsTable } from "~/server/db/schema/results.ts";

export type PersonalRecordPair = {
  eventId: string;
  recordCategory: RecordCategory;
  single: number;
  average: number | undefined;
};

export async function getPersonalRecords({
  organizationId,
  personId,
  eventCategoryId,
  recordCategory,
}: {
  organizationId: string;
  personId: number;
  eventCategoryId: number;
  recordCategory: RecordCategory;
}): Promise<PersonalRecordPair[]> {
  const person = await db.query.persons.findFirst({ columns: { id: true }, where: { organizationId, id: personId } });
  if (!person) throw new Error("Person not found");

  const getPrCte = (bestOrAverage: "best" | "average") => {
    const isAverage = bestOrAverage === "average";
    return sql`
      SELECT DISTINCT ON (${eventsTable.eventId})
        ${eventsTable.eventId},
        ${eventsTable.rank} AS event_rank,
        ${resultsTable[bestOrAverage]} AS best_result
      FROM ${resultsTable}
        INNER JOIN ${eventsTable}
          ON ${resultsTable.organizationId} = ${eventsTable.organizationId} AND ${resultsTable.eventId} = ${eventsTable.eventId}
        INNER JOIN ${eventCategoriesTable} ON ${eventsTable.categoryId} = ${eventCategoriesTable.id}
      WHERE ${resultsTable.approved} IS TRUE
        AND ${resultsTable.recordCategory} = ${recordCategory}
        AND ${eventCategoriesTable.id} = ${eventCategoryId}
        AND ${eventCategoriesTable.hidden} IS FALSE
        AND ${eventsTable.hidden} IS FALSE
        AND ${personId} = ANY(${resultsTable.personIds})
        AND ${resultsTable[bestOrAverage]} > 0
        ${
          isAverage
            ? sql`AND CARDINALITY(${resultsTable.attempts}) = CASE WHEN ${eventsTable.defaultRoundFormat} IN ('5', 'a') THEN 5 ELSE 3 END`
            : sql``
        }
      ORDER BY ${eventsTable.eventId},
        CASE WHEN ${eventsTable.higherIsBetter} THEN ${resultsTable[bestOrAverage]} END DESC,
        CASE WHEN NOT ${eventsTable.higherIsBetter} THEN ${resultsTable[bestOrAverage]} END ASC
    `;
  };

  const rows = await db.execute(sql`
    WITH single_prs AS (${getPrCte("best")}), average_prs AS (${getPrCte("average")})
    SELECT s.event_id, s.best_result AS single, a.best_result AS average
    FROM single_prs s
    LEFT JOIN average_prs a ON s.event_id = a.event_id
    ORDER BY s.event_rank
  `);

  return rows.map((row: any) => {
    return {
      eventId: row.event_id,
      recordCategory,
      single: Number(row.single),
      average: row.average ? Number(row.average) : undefined,
    };
  });
}
