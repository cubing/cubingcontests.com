import type { ReactElement } from "react";
import Competitor from "~/app/components/Competitor.tsx";
import type { Creator } from "~/helpers/types.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";

type Props = {
  creator: Creator | undefined;
  person: PersonResponse | undefined;
  createdExternally?: boolean;
  isCurrentUser?: boolean;
  small?: boolean;
};

function CreatorDetails({ creator, person, createdExternally = false, isCurrentUser = false, small = false }: Props) {
  if (creator && person && creator.personId !== person.personId) {
    throw new Error(
      `Person ID doesn't match between creator object (${JSON.stringify(creator)}) and person object (${JSON.stringify(
        person,
      )})`,
    );
  }

  let specialCase: ReactElement | undefined;
  if (createdExternally) specialCase = <span className="text-warning">External device</span>;
  else if (!creator) specialCase = <span>Deleted user</span>;
  else if (isCurrentUser) specialCase = <span>Me</span>;

  if (specialCase) return small ? specialCase : <div className="mb-3">Created by:&#8194;{specialCase}</div>;

  const username = <a href={`mailto:${creator!.email}`}>{creator!.username}</a>;
  const competitor = <Competitor person={person} noFlag />;

  if (small) {
    return (
      <span className="d-flex column-gap-2 flex-wrap align-items-center">
        {competitor}
        <span>({username})</span>
      </span>
    );
  }

  return (
    <div className="d-flex column-gap-2 mb-3 flex-wrap align-items-center">
      <span>Created by:</span>

      {person ? (
        <>
          {competitor}
          <span>(user: {username})</span>
        </>
      ) : (
        <span>{username}</span>
      )}
    </div>
  );
}

export default CreatorDetails;
