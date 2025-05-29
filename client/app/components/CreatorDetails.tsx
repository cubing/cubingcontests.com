import { ReactElement } from "react";
import Competitor from "~/app/components/Competitor.tsx";
import { Creator } from "~/helpers/types.ts";
import { PersonResponse } from "~/server/db/schema/persons.ts";

type Props = {
  user: Creator | undefined;
  person: PersonResponse | undefined;
  createdExternally: boolean;
  isCurrentUser?: boolean;
  small?: boolean;
};

const CreatorDetails = ({
  user,
  person,
  createdExternally: createdExternally = false,
  isCurrentUser = false,
  small = false,
}: Props) => {
  let specialCase: ReactElement | undefined;
  if (createdExternally) specialCase = <span className="text-warning">External device</span>;
  else if (!user) specialCase = <span>Deleted user</span>;
  else if (isCurrentUser) specialCase = <span>Me</span>;

  if (specialCase) return small ? specialCase : <div className="mb-3">Created by:&#8194;{specialCase}</div>;

  user = user as Creator;
  const username = <a href={`mailto:${user.email}`}>{user.username}</a>;
  const competitor = <Competitor person={person} noFlag />;

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

      {
        /* {person
        ? (
          <> */
      }
      {competitor}
      <span>(user: {username})</span>
      {
        /* </>
        )
        : <span>{username}</span>} */
      }
    </div>
  );
};

export default CreatorDetails;
