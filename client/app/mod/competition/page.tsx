import { eq, inArray, ne, sql } from "drizzle-orm";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import type { Creator } from "~/helpers/types.ts";
import { getIsAdmin } from "~/helpers/utilityFunctions.ts";
import { creatorCols } from "~/server/db/dbUtils.ts";
import { db } from "~/server/db/provider.ts";
import { users as usersTable } from "~/server/db/schema/auth-schema.ts";
import { eventsPublicCols, eventsTable } from "~/server/db/schema/events.ts";
import { type PersonResponse, personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { resultsTable } from "~/server/db/schema/results.ts";
import { roundsPublicCols, roundsTable } from "~/server/db/schema/rounds.ts";
import { authorizeUser } from "~/server/serverUtilityFunctions.ts";
import ContestForm from "./ContestForm.tsx";

type Props = {
  searchParams: Promise<{
    editId?: string;
    copyId?: string;
  }>;
};

async function CreateEditContestPage({ searchParams }: Props) {
  const session = await authorizeUser({ permissions: { competitions: ["create", "update"] } });
  const { editId, copyId } = await searchParams;

  const isAdmin = getIsAdmin(session.user.role);
  const mode = editId ? "edit" : copyId ? "copy" : "new";
  const competitionId = editId ?? copyId;

  const eventsPromise = db.select(eventsPublicCols).from(eventsTable).where(ne(eventsTable.category, "removed"));
  const contestPromise = competitionId
    ? db.query.contests.findFirst({
        columns: isAdmin
          ? undefined
          : {
              createdBy: false,
              createdAt: false,
              updatedAt: false,
            },
        where: { competitionId },
      })
    : undefined;
  const roundsPromise = competitionId
    ? db.select(roundsPublicCols).from(roundsTable).where(eq(roundsTable.competitionId, competitionId))
    : undefined;

  try {
    const [events, contest, rounds] = await Promise.all([eventsPromise, contestPromise, roundsPromise]);

    if (competitionId && !contest) return <LoadingError reason="Contest not found" />;

    let totalResultsByRound: { roundId: number; totalResults: number }[] | undefined;
    let organizers: PersonResponse[] | undefined;
    let creator: Creator | undefined;
    let creatorPerson: PersonResponse | undefined;

    if (contest) {
      if (contest.state === "removed") return <LoadingError reason="This contest has been removed" />;

      const totalResultsByRoundPromise =
        contest.participants > 0
          ? db
              .execute(
                sql`select ${resultsTable.roundId}, count(*) as total_results
                  from ${resultsTable}
                  where ${resultsTable.competitionId} = ${contest.competitionId}
                  group by ${resultsTable.roundId}`,
              )
              .then((res) =>
                res.rows.map((el) => ({ roundId: el.round_id as number, totalResults: Number(el.total_results ?? 0) })),
              )
          : undefined;
      const organizersPromise = db
        .select(personsPublicCols)
        .from(personsTable)
        .where(inArray(personsTable.id, contest.organizers));
      const creatorPromise =
        isAdmin && contest.createdBy
          ? db.select(creatorCols).from(usersTable).where(eq(usersTable.id, contest.createdBy))
          : undefined;
      const [totalResultsByRoundRes, organizersRes, creatorRes] = await Promise.all([
        totalResultsByRoundPromise,
        organizersPromise,
        creatorPromise,
      ]);
      totalResultsByRound = totalResultsByRoundRes;
      organizers = organizersRes;
      creator = creatorRes?.[0];

      if (!isAdmin && (!session.user.personId || !organizers.some((o) => o.personId === session.user.personId)))
        return <LoadingError reason="You do not have access rights for this contest" />;

      if (creator?.personId) {
        creatorPerson = (
          await db.select(personsPublicCols).from(personsTable).where(eq(personsTable.personId, creator.personId))
        ).at(0);
      }
    }

    return (
      <div>
        <h2 className="mb-4 text-center">{mode === "edit" ? "Edit Contest" : "Create Contest"}</h2>

        <ContestForm
          events={events}
          rounds={rounds}
          totalResultsByRound={totalResultsByRound}
          mode={mode}
          contest={contest}
          organizers={organizers}
          creator={creator}
          creatorPerson={creatorPerson}
          session={session}
        />
      </div>
    );
  } catch (err) {
    console.error(err);
    return <LoadingError />;
  }
}

export default CreateEditContestPage;
