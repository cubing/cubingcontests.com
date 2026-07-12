import { and, asc, eq } from "drizzle-orm";
import ContestLayout from "~/app/[slug]/competitions/[id]/ContestLayout.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { getFormattedTime, getFormattedTimeLimit } from "~/helpers/utility-functions.ts";
import { db } from "~/server/db/provider.ts";
import { contestsPublicCols, contestsTable as table } from "~/server/db/schema/contests.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { roundsTable } from "~/server/db/schema/rounds.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

type Props = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

async function ContestEventsPage({ params }: Props) {
  const { slug, id } = await params;

  const organization = await getOrgDetails({ slug });
  const [contest] = await db
    .select(contestsPublicCols)
    .from(table)
    .where(and(eq(table.organizationId, organization.id), eq(table.competitionId, id)));
  const roundsData = await db
    .select()
    .from(roundsTable)
    .innerJoin(
      eventsTable,
      and(eq(roundsTable.organizationId, eventsTable.organizationId), eq(roundsTable.eventId, eventsTable.eventId)),
    )
    .where(and(eq(roundsTable.organizationId, organization.id), eq(roundsTable.competitionId, id)))
    .orderBy(asc(eventsTable.rank), asc(roundsTable.roundNumber));

  if (!contest || !roundsData) return <LoadingError loadingEntity="contest" />;

  return (
    <ContestLayout organizationSlug={slug} contest={contest} activeTab="events">
      <div className="table-responsive mb-5 flex-grow-1">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Round</th>
              <th scope="col">Format</th>
              <th scope="col">Time Limit</th>
              <th scope="col">Cutoff</th>
              <th scope="col">Proceed</th>
            </tr>
          </thead>
          <tbody>
            {roundsData.map(({ rounds: round, events: event }) => {
              const cutoffText = round.cutoffAttemptResult
                ? `${round.cutoffNumberOfAttempts} ${
                    round.cutoffNumberOfAttempts === 1 ? "attempt" : "attempts"
                  } to get < ${getFormattedTime(round.cutoffAttemptResult, { event })}`
                : "";

              return (
                <tr key={round.id} className={round.roundNumber > 1 ? "table-active" : ""}>
                  <td>
                    {round.roundNumber === 1 && (
                      <EventTitle
                        organizationSlug={slug}
                        event={event}
                        fontSize="6"
                        noMargin
                        showIcon
                        linkToRankings
                        showDescription
                      />
                    )}
                  </td>
                  <td>{roundTypes[round.roundTypeId].label}</td>
                  <td>{roundFormats.find((rf) => rf.value === round.format)?.label}</td>
                  <td>{getFormattedTimeLimit({ round, event })}</td>
                  <td>{cutoffText}</td>
                  <td>
                    {round.proceedType &&
                      `Top ${round.proceedValue}${round.proceedType === "percentage" ? "%" : ""} advance to next round`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ContestLayout>
  );
}

export default ContestEventsPage;
