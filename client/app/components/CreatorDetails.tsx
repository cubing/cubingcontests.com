import { ReactElement } from "react";
import Competitor from "~/app/components/Competitor.tsx";
import { IFeUser } from "~/shared_helpers/types.ts";
import { UserInfo } from "~/helpers/types.ts";

const CreatorDetails = ({
  creator,
  small,
  loggedInUser,
}: {
  creator: IFeUser | "EXT_DEVICE" | undefined;
  small?: boolean;
  loggedInUser?: UserInfo;
}) => {
  let specialCase: ReactElement | undefined;
  if (!creator) specialCase = <span>Deleted user</span>;
  else if (creator === "EXT_DEVICE") {
    specialCase = <span className="text-warning">External device</span>;
  } else if (loggedInUser && creator.username === loggedInUser.username) {
    specialCase = <span>Me</span>;
  }

  if (specialCase) return small ? specialCase : <div className="mb-3">Created by:&#8194;{specialCase}</div>;

  creator = creator as IFeUser;
  const username = <a href={`mailto:${creator.email}`}>{creator.username}</a>;
  const competitor = <Competitor person={creator.person} noFlag />;

  if (small) {
    return (
      <span className="d-flex flex-wrap align-items-center column-gap-2">
        {competitor}
        <span>({username})</span>
      </span>
    );
  }

  return (
    <div className="d-flex flex-wrap align-items-center column-gap-2 mb-3">
      <span>Created by:</span>

      {creator.person
        ? (
          <>
            {competitor}
            <span>(user: {username})</span>
          </>
        )
        : <span>{username}</span>}
    </div>
  );
};

export default CreatorDetails;
