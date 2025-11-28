import { asc, eq } from "drizzle-orm";
import ContestLayout from "~/app/competitions/[id]/ContestLayout.tsx";
import EventTitle from "~/app/components/EventTitle.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { roundTypes } from "~/helpers/roundTypes.ts";
import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import { db } from "~/server/db/provider.ts";
import { contestsPublicCols, contestsTable as table } from "~/server/db/schema/contests.ts";
import { eventsTable } from "~/server/db/schema/events.ts";
import { roundsTable } from "~/server/db/schema/rounds.ts";

type Props = {
  params: Promise<{ id: string }>;
};

async function ContestEventsPage({ params }: Props) {
  const { id } = await params;

  const [contest] = await db.select(contestsPublicCols).from(table).where(eq(table.competitionId, id));
  const roundsData = await db
    .select()
    .from(roundsTable)
    .innerJoin(eventsTable, eq(roundsTable.eventId, eventsTable.eventId))
    .where(eq(roundsTable.competitionId, id))
    .orderBy(asc(eventsTable.rank), asc(roundsTable.roundNumber));

  if (!contest || !roundsData) return <LoadingError loadingEntity="contest" />;

  return (
    <ContestLayout contest={contest} activeTab="events">
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
                      <EventTitle event={event} fontSize="6" noMargin showIcon linkToRankings showDescription />
                    )}
                  </td>
                  <td>{roundTypes[round.roundTypeId].label}</td>
                  <td>{roundFormats.find((rf) => rf.value === round.format)?.label}</td>
                  <td>
                    {round.timeLimitCentiseconds && round.timeLimitCumulativeRoundIds
                      ? getFormattedTime(round.timeLimitCentiseconds, { event }) +
                        (round.timeLimitCumulativeRoundIds.length > 0 ? " cumulative" : "")
                      : ""}
                  </td>
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
