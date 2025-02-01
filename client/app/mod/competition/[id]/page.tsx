"use client";

import { useEffect, useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import DataEntryScreen from "~/app/components/adminAndModerator/DataEntryScreen.tsx";
import { IContestData } from "@cc/shared";
import { useParams, useSearchParams } from "next/navigation";

const PostResultsPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();

  const [contestData, setContestData] = useState<IContestData | undefined>();

  useEffect(() => {
    setContestData(undefined);
    myFetch.get(`/competitions/mod/${id}?eventId=${searchParams.get("eventId") ?? "FIRST_EVENT"}`, { authorize: true })
      .then(({ payload, errors }) => {
        if (!errors) setContestData(payload as IContestData);
      });
  }, [id, searchParams]);

  if (!contestData) return <Loading />;

  return <DataEntryScreen compData={contestData} />;
};

export default PostResultsPage;
