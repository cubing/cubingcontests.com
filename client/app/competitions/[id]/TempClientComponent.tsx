"use client";

import { useEffect, useState } from "react";
import ContestControls from "~/app/mod/ContestControls";
import { Role } from "~/helpers/enums";
import { IContest, UserInfo } from "~/helpers/types";
import { getUserInfo } from "~/helpers/utilityFunctions";

const userInfo: UserInfo = getUserInfo();

type Props = {
  contest: IContest;
};

function TempClientComponent({ contest }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (!isClient) setIsClient(true);
  }, [isClient, setIsClient]);

  if (!isClient || !userInfo || (!userInfo.roles.includes(Role.Moderator) && !userInfo.roles.includes(Role.Admin))) {
    return;
  }

  return (
    <div className="mb-3">
      <ContestControls contest={contest} isAdmin={userInfo.isAdmin} />
    </div>
  );
}

export default TempClientComponent;
