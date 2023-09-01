import { IPerson } from '~/shared_helpers/interfaces';

const PersonName = ({ person }: { person: IPerson }) => {
  if (person.wcaId)
    return (
      <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} target="_blank">
        {person.name}
      </a>
    );

  return person.name;
};

export default PersonName;
