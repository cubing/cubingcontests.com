import Competitor from "~/app/components/Competitor.tsx";
import { PersonResponse } from "~/server/db/schema/persons.ts";

type Props = {
  persons: PersonResponse[];
  noFlag?: boolean;
  vertical?: boolean;
};

function Competitors({
  persons,
  noFlag = false,
  vertical = false,
}: Props) {
  if (vertical) {
    return (
      <div className="d-flex flex-column gap-2">
        {persons.map((person, index) =>
          person
            ? <Competitor key={person.personId} person={person} />
            : <span key={index} className="text-danger">COMPETITOR NOT FOUND</span>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex flex-wrap align-items-start gap-2">
      {persons.map((person, index) => (
        person
          ? (
            <span key={person.personId} className="d-flex gap-2">
              <span className="d-none d-md-block">
                <Competitor
                  key={person.personId}
                  person={person}
                  noFlag={noFlag}
                  showLocalizedName={persons.length === 1}
                />
              </span>
              <span className="d-md-none">
                <Competitor key={person.personId} person={person} noFlag={noFlag} />
              </span>
              {index !== persons.length - 1 && <span>&</span>}
            </span>
          )
          : <span key={index} className="text-danger">COMPETITOR NOT FOUND</span>
      ))}
    </div>
  );
}

export default Competitors;
