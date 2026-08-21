import type { PersonResponse } from "~/server/db/schema/persons.ts";
import Region from "./Region.tsx";

type Props = {
  person: Pick<PersonResponse, "name" | "localizedName" | "regionCode" | "wcaId"> | undefined;
  showWcaId?: boolean;
  showLocalizedName?: boolean; // showWcaId overrides this
  noFlag?: boolean;
  noLink?: boolean;
};

function Competitor({ person, showWcaId = false, showLocalizedName = false, noFlag = false, noLink = false }: Props) {
  if (!person) return <span className="text-danger">Not found</span>;

  let displayText = person.name;
  if (showWcaId && person.wcaId) displayText += ` [${person.wcaId}]`;
  else if (showLocalizedName && person.localizedName) displayText += ` (${person.localizedName})`;

  return (
    <span className={noFlag ? "" : "d-flex gap-2 align-items-center"}>
      {noLink || !person.wcaId ? (
        displayText
      ) : (
        <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} target="_blank" rel="noopener">
          {displayText}
        </a>
      )}

      {!noFlag && <Region regionCode={person.regionCode} noText />}
    </span>
  );
}

export default Competitor;
