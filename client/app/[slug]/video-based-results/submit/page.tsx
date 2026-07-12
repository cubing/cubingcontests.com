import ResultsSubmissionForm from "~/app/[slug]/video-based-results/ResultsSubmissionForm.tsx";
import { auth } from "~/server/auth.ts";
import {
  authorizeUser,
  getRecordConfigs,
  getRegions,
  getSettingFromDb,
  getVideoBasedEvents,
} from "~/server/server-only-functions/server-only-functions.ts";

async function SubmitResultsPage() {
  const { organization, httpHeaders } = await authorizeUser({
    useOrganization: true,
    orgPermissions: { videoBasedResults: ["create"] },
  });

  const [
    videoBasedResultsEnabled,
    videoBasedResultsRules,
    videoBasedResultsContactEmail,
    events,
    recordConfigs,
    regions,
    { success: isVideoBasedResultReviewer },
  ] = await Promise.all([
    getSettingFromDb({ key: "video-based-results-enabled", organizationId: organization!.id }),
    getSettingFromDb({ key: "video-based-results-rules", organizationId: organization!.id, optional: true }),
    getSettingFromDb({ key: "video-based-results-contact-email", organizationId: organization!.id, optional: true }),
    getVideoBasedEvents(organization!.id),
    getRecordConfigs(organization!.id, { recordCategory: "online" }),
    getRegions(organization!.id),
    auth.api.hasPermission({
      headers: httpHeaders,
      body: { permissions: { videoBasedResults: ["update", "approve", "delete"] } },
    }),
  ]);

  if (videoBasedResultsEnabled !== "true")
    return <p className="fs-4 mx-3 mt-5 text-center">Video-based results are disabled</p>;

  return (
    <section>
      <h2 className="text-center">Submit Results</h2>

      <ResultsSubmissionForm
        videoBasedResultsRules={videoBasedResultsRules}
        videoBasedResultsContactEmail={videoBasedResultsContactEmail}
        events={events}
        recordConfigs={recordConfigs}
        regions={regions}
        isVideoBasedResultReviewer={isVideoBasedResultReviewer}
      />
    </section>
  );
}

export default SubmitResultsPage;
