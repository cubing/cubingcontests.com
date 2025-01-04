"use client";

import { useEffect, useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import DataEntryScreen from "~/app/components/adminAndModerator/DataEntryScreen.tsx";
import { IContestData } from "@cc/shared";

type Props = {
  params: { id: string };
  searchParams: { eventId: string };
};

const PostResultsPage = ({ params: { id }, searchParams: { eventId } }: Props) => {
  const myFetch = useMyFetch();

  const [contestData, setContestData] = useState<IContestData | undefined>();

  useEffect(() => {
    setContestData(undefined);
    myFetch.get(`/competitions/mod/${id}?eventId=${eventId ?? "FIRST_EVENT"}`, { authorize: true })
      .then(({ payload, errors }) => {
        if (!errors) setContestData(payload as IContestData);
      });
  }, [id, eventId]);

  if (!contestData) return <Loading />;

  return <DataEntryScreen compData={contestData} />;
};

export default PostResultsPage;
