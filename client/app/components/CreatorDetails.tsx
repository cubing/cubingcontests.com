import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactElement } from "react";
import Competitor from "~/app/components/Competitor.tsx";
import type { Creator } from "~/helpers/types.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

const ApiIcon = (
  <span title="created via API">
    <FontAwesomeIcon icon={faGear} className="text-warning" />
  </span>
);

type Props = {
  creator: Creator | null; // null means the user has been deleted
  regions: RegionResponse[];
  createdExternally?: boolean;
  isCurrentUser?: boolean;
  small?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function CreatorDetails({
  creator,
  regions,
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
  const competitor = creator?.person ? <Competitor person={creator.person} regions={regions} noFlag /> : undefined;

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
