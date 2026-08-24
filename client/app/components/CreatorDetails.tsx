import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactElement } from "react";
import Person from "~/app/components/Person.tsx";
import type { Creator } from "~/helpers/types.ts";

const ApiIcon = (
  <span title="created via API">
    <FontAwesomeIcon icon={faGear} className="text-warning" />
  </span>
);

type Props = {
  creator: Creator | null; // null means the user has been deleted
  createdExternally?: boolean;
  isCurrentUser?: boolean;
  small?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function CreatorDetails({
  creator,
  createdExternally = false,
  isCurrentUser = false,
  small = false,
  className,
}: Props) {
  let specialCase: ReactElement | undefined;
  if (creator === null) specialCase = <span className="text-danger">Deleted user</span>;
  else if (isCurrentUser) specialCase = <span>Me</span>;

  if (specialCase) {
    return (
      <div className={`d-flex column-gap-2 align-items-center ${className}`}>
        {!small && "Created by:"}
        {specialCase}
        {createdExternally && ApiIcon}
      </div>
    );
  }

  const creatorName = creator?.email ? <a href={`mailto:${creator.email}`}>{creator!.name}</a> : creator!.name;
  const competitor = creator?.person ? <Person person={creator.person} noFlag showWcaLink /> : undefined;

  return (
    <div className={`d-flex column-gap-2 flex-wrap align-items-center ${className}`}>
      {!small && <span>Created by:</span>}
      {competitor}
      <span>(user: {creatorName})</span>
      {createdExternally && ApiIcon}
    </div>
  );
}

export default CreatorDetails;
