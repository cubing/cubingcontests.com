import { and, eq, inArray, sql } from "drizzle-orm";
import { SWRConfig } from "swr";
import z from "zod";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { Creator } from "~/helpers/types.ts";
import { getMemberControlsContest } from "~/helpers/utility-functions.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { type PersonResponse, personsPublicCols, personsTable } from "~/server/db/schema/persons.ts";
import { resultsTable } from "~/server/db/schema/results.ts";
import { roundsPublicCols, roundsTable } from "~/server/db/schema/rounds.ts";
import { authorizeUser, getCreators, getEvents, getRegions, getSettingFromDb } from "~/server/server-only-functions.ts";
import ContestForm from "./ContestForm.tsx";

const SearchParamsValidator = z.strictObject({
  editId: z.string().nonempty().optional(),
  copyId: z.string().nonempty().optional(),
});

type Props = {
  searchParams: Promise<z.infer<typeof SearchParamsValidator>>;
};

async function CreateEditContestPage({ searchParams }: Props) {
  const { editId, copyId } = SearchParamsValidator.parse(await searchParams);
  const { member, organization, httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { competitions: ["create", "update"], meetups: ["create", "update"] },
  });

  const [{ success: canApprove }, regions] = await Promise.all([
    auth.api.hasPermission({
      headers: httpHeaders,
      body: { permissions: { competitions: ["approve"], meetups: ["approve"] } },
    }),
    getRegions(organization!.id),
  ]);

  const mode = editId ? "edit" : copyId ? "copy" : "new";
  const competitionId = editId ?? copyId;

  try {
    const [events, contest, rounds] = await Promise.all([
      getEvents({ organizationId: organization!.id, includeHiddenAndRemoved: true }),
      competitionId
        ? db.query.contests.findFirst({
            columns: canApprove
              ? undefined
              : {
                  id: true,
                  competitionId: true,
                  state: true,
                  name: true,
                  shortName: true,
                  type: true,
                  regionCode: true,
                  city: true,
                  venue: true,
                  address: true,
                  latitudeMicrodegrees: true,
                  longitudeMicrodegrees: true,
                  startDate: true,
                  endDate: true,
                  startTime: true,
                  timezone: true,
                  organizerIds: true,
                  contact: true,
                  description: true,
                  competitorLimit: true,
                  participants: true,
                  schedule: true,
                },
            where: { organizationId: organization!.id, competitionId },
          })
        : undefined,
      competitionId
        ? db
            .select(roundsPublicCols)
            .from(roundsTable)
            .where(and(eq(roundsTable.organizationId, organization!.id), eq(roundsTable.competitionId, competitionId)))
        : undefined,
    ]);

    if (competitionId && !contest) return <LoadingError reason="Contest not found" />;

    let totalResultsByRound: { roundId: number; totalResults: number }[] | undefined;
    let organizers: PersonResponse[] | undefined;
    let creator: Creator | null | undefined;

    if (contest) {
      if (!getMemberControlsContest(member!, contest))
        return <LoadingError reason="You do not have access rights for this contest" />;

      const [totalResultsByRoundRes, organizersRes, [creatorRes]] = await Promise.all([
        contest.participants > 0
          ? // TO-DO: USE A DRIZZLE AGGREGATION QUERY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            db
              .execute(
                sql`SELECT ${resultsTable.roundId}, COUNT(*) AS total_results
                  FROM ${resultsTable}
                  WHERE ${resultsTable.organizationId} = ${organization!.id}
                    AND ${resultsTable.competitionId} = ${contest.competitionId}
                  GROUP BY ${resultsTable.roundId}`,
              )
              .then((res) =>
                res.map((row) => ({ roundId: row.round_id as number, totalResults: Number(row.total_results ?? 0) })),
              )
          : undefined,
        db.select(personsPublicCols).from(personsTable).where(inArray(personsTable.id, contest.organizerIds)),
        canApprove && contest.createdBy
          ? getCreators({ organizationId: organization!.id, userIds: [contest.createdBy] })
          : [],
      ]);
      totalResultsByRound = totalResultsByRoundRes;
      organizers = organizersRes;
      creator = creatorRes;
    }

    return (
      <section>
        <h2 className="mb-4 text-center">{mode === "edit" ? "Edit Contest" : "Create Contest"}</h2>

        <SWRConfig
          value={{
            fallback: {
              [SwrKey.ContestTypes]: getSettingFromDb({ key: "contest-types", organizationId: organization!.id }),
            },
          }}
        >
          <ContestForm
            events={events}
            rounds={rounds}
            totalResultsByRound={totalResultsByRound}
            regions={regions}
            mode={mode}
            contest={contest}
            organizers={organizers}
            creator={creator}
          />
        </SWRConfig>
      </section>
    );
  } catch (err) {
    console.error(err);
    return <LoadingError />;
  }
}

export default CreateEditContestPage;
