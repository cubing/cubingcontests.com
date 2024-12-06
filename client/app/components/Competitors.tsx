import Competitor from "~/app/components/Competitor.tsx";
import { IPerson } from "~/shared_helpers/types.ts";

type Props = {
  persons: IPerson[];
  noFlag?: boolean;
  vertical?: boolean;
};

const Competitors = ({
  persons,
  noFlag = false,
  vertical = false,
}: Props) => {
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
      ))}
    </div>
  );
};

export default Competitors;
