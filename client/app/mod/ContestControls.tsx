"use client";

import { faClock, faCopy, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import Button from "~/app/components/UI/Button";
import { ContestState, ContestType } from "~/helpers/enums";

type Props = {
  contest: IContest;
  updateContest?: (newContest: IContest) => void;
  isAdmin?: boolean;
  smallButtons?: boolean;
};

function ContestControls({ contest, updateContest, isAdmin = false, smallButtons }: Props) {
  const [loadingId, setLoadingId] = useState("");

  const showApproveButton = contest.state === ContestState.Created && isAdmin &&
    (contest.meetupDetails || contest.compDetails);

  const changeState = async (newState: ContestState) => {
    //   const verb = newState === ContestState.Approved
    //     ? "approve"
    //     : newState === ContestState.Finished
    //     ? "finish"
    //     : newState === ContestState.Published
    //     ? "publish"
    //     : "ERROR";

    //   if (confirm(`Are you sure you would like to ${verb} ${contest.name}?`)) {
    //     setLoadingId(`set_state_${newState}_${contest.competitionId}_button`);
    //     const res = await myFetch.patch(`/competitions/set-state/${contest.competitionId}`, { newState });

    //     if (res.success) {
    //       if (updateContest) {
    //         updateContest(res.data);
    //         setLoadingId("");
    //       } else {
    //         window.location.reload();
    //       }
    //     } else {
    //       setLoadingId("");
    //     }
    //   }
  };

  return (
    <div className="d-flex gap-2">
      {(contest.state < ContestState.Finished || isAdmin) && (
        <Link
          href={`/mod/competition?edit_id=${contest.competitionId}`}
          prefetch={false}
          className={`btn btn-primary ${smallButtons ? "btn-xs" : ""}`}
          title="Edit"
          aria-label="Edit"
        >
          <FontAwesomeIcon icon={faPencil} />
        </Link>
      )}
      {contest.type !== ContestType.WcaComp && (
        <Link
          href={`/mod/competition?copy_id=${contest?.competitionId}`}
          prefetch={false}
          className={`btn btn-primary ${smallButtons ? "btn-xs" : ""}`}
          title="Clone"
          aria-label="Clone"
        >
          <FontAwesomeIcon icon={faCopy} />
        </Link>
      )}
      {
        /* {(contest.state >= ContestState.Approved &&
        contest.state < ContestState.Published &&
        (contest.state < ContestState.Finished || isAdmin)) && (
        <Link
          href={`/mod/competition/${contest.competitionId}`}
          prefetch={false}
          className={`btn btn-success ${smallButtons ? "btn-xs" : ""}`}
        >
          Results
        </Link>
      )}
      {showApproveButton && (
        <Button
          id={`set_state_${ContestState.Approved}_${contest.competitionId}_button`}
          type="button"
          onClick={() => changeState(ContestState.Approved)}
          loadingId={loadingId}
          className={`btn btn-warning ${smallButtons ? "btn-xs" : ""}`}
        >
          Approve
        </Button>
      )}
      {contest.state === ContestState.Ongoing && (
        <Button
          id={`set_state_${ContestState.Finished}_${contest.competitionId}_button`}
          type="button"
          onClick={() => changeState(ContestState.Finished)}
          loadingId={loadingId}
          className={`btn btn-warning ${smallButtons ? "btn-xs" : ""}`}
        >
          Finish
        </Button>
      )}
      {contest.state === ContestState.Finished &&
        (isAdmin
          ? (
            <Button
              id={`set_state_${ContestState.Published}_${contest.competitionId}_button`}
              type="button"
              onClick={() => changeState(ContestState.Published)}
              loadingId={loadingId}
              className={`btn btn-warning ${smallButtons ? "btn-xs" : ""}`}
            >
              Publish
            </Button>
          )
          : (
            <FontAwesomeIcon
              icon={faClock}
              title="Contest pending review"
              aria-label="Contest pending review"
              className="my-1 fs-5"
            />
          ))} */
      }
    </div>
  );
}

export default ContestControls;
