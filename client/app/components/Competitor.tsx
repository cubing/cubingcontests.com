import Country from "./Country.tsx";
import { PersonResponse } from "~/server/db/schema/persons.ts";

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
    <span className={noFlag ? "" : "d-flex align-items-center gap-2"}>
      {noLink || !person.wcaId
        ? displayText
        : <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} target="_blank">{displayText}</a>}

      {!noFlag && <Country countryIso2={person.countryIso2} noText />}
    </span>
  );
}

export default Competitor;
