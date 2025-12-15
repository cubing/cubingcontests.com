import type { PersonResponse } from "~/server/db/schema/persons.ts";
import Country from "./Country.tsx";

type Props = {
  person: PersonResponse | undefined;
  showLocalizedName?: boolean;
  noFlag?: boolean;
  noLink?: boolean;
};

function Competitor({ person, showLocalizedName, noFlag, noLink }: Props) {
  if (!person) return <span className="text-danger">Not found</span>;

  let displayText = person.name;
  if (showLocalizedName && person.localizedName) displayText += ` (${person.localizedName})`;

  return (
    <span className={noFlag ? "" : "d-flex gap-2 align-items-center"}>
      {noLink || !person.wcaId ? (
        displayText
      ) : (
        <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} target="_blank" rel="noopener">
          {displayText}
        </a>
      )}

      {!noFlag && <Country countryIso2={person.regionCode} noText />}
    </span>
  );
}

export default Competitor;
