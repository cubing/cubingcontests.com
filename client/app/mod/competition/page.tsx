"use client";

import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMyFetch } from "~/helpers/customHooks.ts";
import { type Event, type IContestData } from "~/helpers/types.ts";
import { MainContext } from "~/helpers/contexts.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import ContestForm from "./ContestForm.tsx";

const CreateEditContestPage = () => {
  const myFetch = useMyFetch();
  const { changeErrorMessages } = useContext(MainContext);

  const [events, setEvents] = useState<Event[]>();
  const [contestData, setContestData] = useState<IContestData | undefined>();

  const searchParams = useSearchParams();

  let mode: "new" | "edit" | "copy" = "new";
  let competitionId = searchParams.get("edit_id");

  if (competitionId) {
    mode = "edit";
  } else {
    competitionId = searchParams.get("copy_id");
    if (competitionId) mode = "copy";
  }

  useEffect(() => {
    // CODE SMELL!!!
    (async () => {
      const { data: eventsData, errors: errors1 } = await myFetch.get(
        "/events/mod",
        { authorize: true, loadingId: null },
      );
      const { data: contestData, errors: errors2 } = competitionId
        ? await myFetch.get(`/competitions/mod/${competitionId}`, { authorize: true, loadingId: null })
        : { data: undefined, errors: undefined };

      if (errors1 ?? errors2) {
        changeErrorMessages(["Error while fetching contest data"]);
      } else {
        setEvents(eventsData);
        if (contestData) setContestData(contestData);
      }
    })();
  }, []);

  if (events && (mode === "new" || contestData)) {
    return (
      <div>
        <h2 className="mb-4 text-center">{mode === "edit" ? "Edit Contest" : "Create Contest"}</h2>

        <ContestForm events={events} mode={mode} contest={contestData?.contest} creator={contestData?.creator} />
      </div>
    );
  }

  return <Loading />;
};

export default CreateEditContestPage;
