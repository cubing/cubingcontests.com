"use client";

import { faClock, faCopy, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useContext, useState } from "react";
import Button from "~/app/components/UI/Button.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import type { ContestState } from "~/helpers/types.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";

type Props = {
  contest: ContestResponse;
  updateContest?: (newContest: ContestResponse) => void;
  isAdmin?: boolean;
  smallButtons?: boolean;
};

function ContestControls({ contest, updateContest, isAdmin = false, smallButtons }: Props) {
  const { changeErrorMessages } = useContext(MainContext);

  const [loadingId, setLoadingId] = useState("");

  const changeState = async (newState: ContestState) => {
    const verb =
      newState === "approved"
        ? "approve"
        : newState === "finished"
          ? "finish"
          : newState === "published"
            ? "publish"
            : "ERROR";

    if (confirm(`Are you sure you would like to ${verb} ${contest.name}?`)) {
      // setLoadingId(`set_state_${newState}_${contest.competitionId}_button`);
      // const res = await myFetch.patch(`/competitions/set-state/${contest.competitionId}`, { newState });

      // if (res.success) {
      //   if (updateContest) {
      //     updateContest(res.data);
      //     setLoadingId("");
      //   } else {
      //     window.location.reload();
      //   }
      // } else {
      //   setLoadingId("");
      // }
      changeErrorMessages(["ERROR: not implemented"]);
      throw new Error("NOT IMPLEMENTED!");
    }
  };

  return (
    <div className="d-flex gap-2">
      {(["created", "approved", "ongoing"].includes(contest.state) || isAdmin) && (
        <Link
          href={`/mod/competition?editId=${contest.competitionId}`}
          prefetch={false}
          className={`btn btn-primary ${smallButtons ? "btn-xs" : ""}`}
          title="Edit"
          aria-label="Edit"
        >
          <FontAwesomeIcon icon={faPencil} />
        </Link>
      )}
      {contest.type !== "wca-comp" && (
        <Link
          href={`/mod/competition?copyId=${contest?.competitionId}`}
          prefetch={false}
          className={`btn btn-primary ${smallButtons ? "btn-xs" : ""}`}
          title="Clone"
          aria-label="Clone"
        >
          <FontAwesomeIcon icon={faCopy} />
        </Link>
      )}
      {(["approved", "ongoing"].includes(contest.state) || (isAdmin && contest.state === "finished")) && (
        <Link
          href={`/mod/competition/${contest.competitionId}`}
          prefetch={false}
          className={`btn btn-success ${smallButtons ? "btn-xs" : ""}`}
        >
          Results
        </Link>
      )}
      {contest.state === "created" && isAdmin && (
        <Button
          id={`set_state_approved_${contest.competitionId}_button`}
          type="button"
          onClick={() => changeState("approved")}
          loadingId={loadingId}
          className={`btn btn-warning ${smallButtons ? "btn-xs" : ""}`}
        >
          Approve
        </Button>
      )}
      {contest.state === "ongoing" && (
        <Button
          id={`set_state_finished_${contest.competitionId}_button`}
          type="button"
          onClick={() => changeState("finished")}
          loadingId={loadingId}
          className={`btn btn-warning ${smallButtons ? "btn-xs" : ""}`}
        >
          Finish
        </Button>
      )}
      {contest.state === "finished" &&
        (isAdmin ? (
          <Button
            id={`set_state_published_${contest.competitionId}_button`}
            type="button"
            onClick={() => changeState("published")}
            loadingId={loadingId}
            className={`btn btn-warning ${smallButtons ? "btn-xs" : ""}`}
          >
            Publish
          </Button>
        ) : (
          <FontAwesomeIcon
            icon={faClock}
            title="Contest pending review"
            aria-label="Contest pending review"
            className="fs-5 my-1"
          />
        ))}
    </div>
  );
}

export default ContestControls;
