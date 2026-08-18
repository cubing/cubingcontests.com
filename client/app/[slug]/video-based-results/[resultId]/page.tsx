import z from "zod";
import ResultsSubmissionForm from "~/app/[slug]/video-based-results/ResultsSubmissionForm.tsx";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import {
  authorizeUser,
  getCreators,
  getRecordConfigs,
  getRegions,
  getVideoBasedEvents,
} from "~/server/server-only-functions/server-only-functions.ts";

const ParamsValidator = z.strictObject({
  slug: z.string().nonempty(),
  resultId: z.string().transform((val) => Number(val)),
});

type Props = {
  params: Promise<z.infer<typeof ParamsValidator>>;
};

async function UpdateVideoBasedResultPage({ params }: Props) {
  const { resultId } = ParamsValidator.parse(await params);
  const { organization } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { videoBasedResults: ["update", "approve", "delete"] },
  });

  const [events, recordConfigs, regions, result] = await Promise.all([
    getVideoBasedEvents(organization!.id),
    getRecordConfigs(organization!.id, { recordCategory: "online" }),
    getRegions(organization!.id),
    db.query.results.findFirst({ where: { organizationId: organization!.id, id: resultId } }),
  ]);

  if (!result) return <LoadingError />;

  const participants = await db.query.persons.findMany({ where: { id: { in: result.personIds } } });
  const creator = result.createdBy
    ? ((await getCreators({ organizationId: organization!.id, userIds: [result.createdBy], includeEmails: true })).at(
        0,
      ) ?? null)
    : null;

  return (
    <section>
      <h2 className="text-center">Edit Result</h2>

      <ResultsSubmissionForm
        videoBasedResultsRules={null}
        videoBasedResultsContactEmail={null}
        events={events}
        recordConfigs={recordConfigs}
        regions={regions}
        result={result}
        participants={participants}
        creator={creator}
        isVideoBasedResultReviewer // already checked on page load above
      />
    </section>
  );
}

export default UpdateVideoBasedResultPage;
