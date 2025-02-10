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
    (async () => {
      const promises: Promise<any>[] = [myFetch.get<Event[]>("/events/mod", {
        authorize: true,
        loadingId: null,
      })];

      if (competitionId) {
        promises.push(
          myFetch.get<IContestData>(`/competitions/mod/${competitionId}`, {
            authorize: true,
            loadingId: null,
          }),
        );
      }

      const settled = await Promise.allSettled(promises);

      if (settled.some((p) => p.status === "rejected" || !p.value.success)) {
        changeErrorMessages(["Error while fetching contest data"]);
      } else {
        setEvents((settled[0] as any).value.data);
        if (competitionId) setContestData((settled[1] as any).value.data);
      }
    })();
  }, []);

  if (events && (mode === "new" || contestData)) {
    return (
      <div>
        <h2 className="mb-4 text-center">
          {mode === "edit" ? "Edit Contest" : "Create Contest"}
        </h2>

        <ContestForm
          events={events}
          mode={mode}
          contest={contestData?.contest}
          creator={contestData?.creator}
        />
      </div>
    );
  }

  return <Loading />;
};

export default CreateEditContestPage;
