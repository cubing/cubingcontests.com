import Competitor from "~/app/components/Competitor.tsx";
import { IPerson } from "~/shared_helpers/types.ts";

const Competitors = ({
  persons,
  noFlag = false,
  vertical = false,
}: {
  persons: IPerson[];
  noFlag?: boolean;
  vertical?: boolean;
}) => {
  if (vertical) {
    return (
      <div className="d-flex flex-column gap-2">
        {persons.map((person) => <Competitor key={person.personId} person={person} />)}
      </div>
    );
  }

  return (
    <div className="d-flex flex-wrap align-items-start gap-2">
      {persons.map((person, index) => (
        <span key={person.personId} className="d-flex gap-2">
          <Competitor key={person.personId} person={person} noFlag={noFlag} />
          {index !== persons.length - 1 && <span>&</span>}
        </span>
      ))}
    </div>
  );
};

export default Competitors;
