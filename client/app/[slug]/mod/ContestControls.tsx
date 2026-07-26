"use client";

import { faClock, faCopy, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext } from "react";
import useSWR from "swr";
import Button from "~/app/components/UI/Button.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import {
  clientGetHasPermission,
  getActionError,
  getMemberControlsContest,
  slugPath,
} from "~/helpers/utility-functions.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";
import {
  approveContestSF,
  finishContestSF,
  publishContestSF,
} from "~/server/server-functions/contest-server-functions.ts";

type ModDashboardProps = {
  forPage: "mod-dashboard";
  onUpdateContestState: () => void;
};

type ContestDetailsProps = {
  forPage: "contest-details";
  onUpdateContestState?: never;
};

type Props = {
  contest: ContestResponse;
} & (ModDashboardProps | ContestDetailsProps);

function ContestControls({ contest, forPage, onUpdateContestState }: Props) {
  const router = useRouter();
  const { slug }: { slug: string } = useParams();
  const { session, member } = useSession();
  const { changeErrorMessages } = useContext(MainContext);

  const { executeAsync: approveContest, isPending: isApproving } = useAction(approveContestSF);
  const { executeAsync: finishContest, isPending: isFinishing } = useAction(finishContestSF);
  const { executeAsync: publishContest, isPending: isPublishing } = useAction(publishContestSF);
  const { data: canCreateAndUpdateContests } = useSWR(session ? [SwrKey.CanCreateContests, session] : null, () =>
    clientGetHasPermission({ competitions: ["create", "update"], meetups: ["create", "update"] }),
  );
  const { data: canApproveContests } = useSWR(session ? [SwrKey.CanApproveContests, session] : null, () =>
    clientGetHasPermission({ competitions: ["approve"], meetups: ["approve"] }),
  );
  const { data: canPublishContests } = useSWR(session ? [SwrKey.CanPublishContests, session] : null, () =>
    clientGetHasPermission({ competitions: ["publish"], meetups: ["publish"] }),
  );
  const { data: canSubmitOwnOnlineCompResult } = useSWR(
    session ? [SwrKey.CanSubmitOwnOnlineCompResult, session] : null,
    () => clientGetHasPermission({ onlineComps: ["submit-own-result"] }),
  );

  const isPending = isApproving || isFinishing || isPublishing;
  const smallButtons = forPage === "mod-dashboard";
  // This is similar to the logic in the create contest result server function
  const userControlsContest = canCreateAndUpdateContests && getMemberControlsContest(member!, contest);
  const hasAccessToResults =
    canCreateAndUpdateContests || (canSubmitOwnOnlineCompResult && contest.type === "online" && member!.personId);

  const onApproveContest = async () => {
    if (confirm(`Are you sure you would like to approve ${contest.name}?`)) {
      const res = await approveContest({ competitionId: contest.competitionId });

      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      else if (forPage === "mod-dashboard") onUpdateContestState();
      else router.refresh();
    }
  };

  const onFinishContest = async () => {
    if (confirm(`Are you sure you would like to finish ${contest.name}?`)) {
      const res = await finishContest({ competitionId: contest.competitionId });

      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      else if (forPage === "mod-dashboard") onUpdateContestState();
      else router.refresh();
    }
  };

  const onPublishContest = async () => {
    if (confirm(`Are you sure you would like to publish ${contest.name}?`)) {
      const res = await publishContest({ competitionId: contest.competitionId });

      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      else if (forPage === "mod-dashboard") onUpdateContestState();
      else router.refresh();
    }
  };

  return (
    <div className="d-flex gap-2 align-items-center">
      {session && (
        <>
          {userControlsContest &&
            (canPublishContests || ["created", "approved", "ongoing"].includes(contest.state)) && (
              <Link
                href={slugPath(slug, `/mod/competition?editId=${contest.competitionId}`)}
                prefetch={false}
                className={`btn btn-primary ${smallButtons ? "btn-xs" : ""}`}
                title="Edit"
                aria-label="Edit"
              >
                <FontAwesomeIcon icon={faPencil} />
              </Link>
            )}
          {userControlsContest && contest.type !== "wca-comp" && (
            <Link
              href={slugPath(slug, `/mod/competition?copyId=${contest.competitionId}`)}
              prefetch={false}
              className={`btn btn-primary ${smallButtons ? "btn-xs" : ""}`}
              title="Clone"
              aria-label="Clone"
            >
              <FontAwesomeIcon icon={faCopy} />
            </Link>
          )}
          {((hasAccessToResults && ["approved", "ongoing"].includes(contest.state)) ||
            (canPublishContests && contest.state === "finished")) && (
            <Link
              href={slugPath(slug, `/mod/competition/${contest.competitionId}`)}
              prefetch={false}
              className={`btn btn-success ${smallButtons ? "btn-xs" : ""}`}
            >
              {canCreateAndUpdateContests || forPage === "mod-dashboard" ? "Results" : "Submit Result"}
            </Link>
          )}
          {canApproveContests && contest.state === "created" && (
            <Button
              type="button"
              onClick={() => onApproveContest()}
              isLoading={isApproving}
              disabled={isPending}
              className={`btn-warning ${smallButtons ? "btn-xs" : ""}`}
            >
              Approve
            </Button>
          )}
          {userControlsContest && contest.state === "ongoing" && (
            <Button
              type="button"
              onClick={() => onFinishContest()}
              isLoading={isFinishing}
              disabled={isPending}
              className={`btn-warning ${smallButtons ? "btn-xs" : ""}`}
            >
              Finish
            </Button>
          )}
          {contest.state === "finished" && canPublishContests && (
            <Button
              type="button"
              onClick={() => onPublishContest()}
              isLoading={isPublishing}
              disabled={isPending}
              className={`btn-warning ${smallButtons ? "btn-xs" : ""}`}
            >
              Publish
            </Button>
          )}
          {forPage === "mod-dashboard" && contest.state === "finished" && !canPublishContests && (
            <span title="Contest pending review">
              <FontAwesomeIcon icon={faClock} aria-label="Contest pending review" className="fs-5 mt-1" />
            </span>
          )}
        </>
      )}
    </div>
  );
}

export default ContestControls;
