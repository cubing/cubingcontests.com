"use client";

import { use } from "react";
import DonateButton from "~/app/components/DonateButton.tsx";
import { C } from "~/helpers/constants.ts";
import type { OrganizationDetails } from "~/helpers/types.ts";

type Props = {
  organization: OrganizationDetails;
  kofiGoalProgressPromise: Promise<string | null>;
};

function DonateSection({ organization, kofiGoalProgressPromise }: Props) {
  if (!organization.metadata.showDonationLinks) return;

  const kofiGoalProgress = use(kofiGoalProgressPromise);

  return (
    <>
      <h3 className="rr-basic-heading">Support RecordRanks</h3>
      <p>
        {organization.name} is powered by RecordRanks, an{" "}
        <a href={C.sourceCodeLink} target="_blank" rel="noreferrer">
          open source project
        </a>{" "}
        created for the benefit of hobby sports communities. You can contribute through the{" "}
        <a href={C.rrDonationLink} target="_blank" rel="noreferrer">
          Ko-fi page
        </a>{" "}
        without creating an account. All contributions directly support the development of RecordRanks.
      </p>
      <DonateButton />

      {kofiGoalProgress !== null && (
        <>
          <h4 className="mt-4">Goals</h4>
          <p>
            Prioritize RR feature: <strong>Personal Records</strong>
          </p>
          <div
            role="progressbar"
            className="progress mb-2"
            style={{ height: "1.3rem" }}
            aria-label="Goal progress"
            aria-valuenow={17}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar fs-6 fw-semibold bg-success" style={{ width: `${kofiGoalProgress}%` }}>
              {kofiGoalProgress}%
            </div>
          </div>
          <p className="mt-3">
            When this goal is reached, the Personal Records feature will be prioritized to be implemented into
            RecordRanks.
          </p>
        </>
      )}
    </>
  );
}

export default DonateSection;
