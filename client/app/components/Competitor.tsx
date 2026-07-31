"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { slugPath } from "~/helpers/utility-functions.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";
import Region from "./Region.tsx";

type Props = {
  person: Pick<PersonResponse, "id" | "name" | "localizedName" | "regionCode" | "wcaId"> | undefined;
  regions: RegionResponse[];
  showWcaId?: boolean;
  showLocalizedName?: boolean; // showWcaId overrides this
  noFlag?: boolean;
  noLink?: boolean;
};

function Competitor({
  person,
  regions,
  showWcaId = false,
  showLocalizedName = false,
  noFlag = false,
  noLink = false,
}: Props) {
  const { slug }: { slug: string } = useParams();

  if (!person) return <span className="text-danger">Not found</span>;

  let displayText = person.name;
  if (showWcaId && person.wcaId) displayText += ` [${person.wcaId}]`;
  else if (showLocalizedName && person.localizedName) displayText += ` (${person.localizedName})`;

  return (
    <span className={noFlag ? "" : "d-flex gap-2 align-items-center"}>
      {noLink ? (
        displayText
      ) : (
        <Link href={slugPath(slug, `/persons/${person.id}`)} prefetch={false}>
          {displayText}
        </Link>
      )}

      {!noFlag && <Region regionCode={person.regionCode} regions={regions} noText />}
    </span>
  );
}

export default Competitor;
