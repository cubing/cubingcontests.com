import { IFePerson, IPerson } from "~/helpers/types.ts";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { useMyFetch } from "~/helpers/customHooks.ts";

type Props = {
  onSelectPerson: (person: IPerson) => void;
  onResetFilters: () => void;
  disabled: boolean;
};

const ModFilters = ({ onSelectPerson, onResetFilters, disabled }: Props) => {
  const myFetch = useMyFetch();
  const searchParams = useSearchParams();

  const [persons, setPersons] = useState<InputPerson[]>([null]);
  const [personNames, setPersonNames] = useState([""]);

  const organizerId = searchParams.get("organizerId");

  useEffect(() => {
    if (organizerId) {
      myFetch.get<IFePerson>(`/persons?personId=${organizerId}`).then((res) => {
        if (res.success) {
          setPersons([res.data]);
          setPersonNames([res.data.name]);
        }
      });
    }
  }, []);

  const resetFilters = () => {
    onResetFilters();
    setPersons([null]);
    setPersonNames([""]);
  };

  return (
    <FiltersContainer>
      <FormPersonInputs
        title={userInfo?.isAdmin ? "Organizer/creator" : "Organizer"}
        persons={persons}
        setPersons={setPersons}
        personNames={personNames}
        setPersonNames={setPersonNames}
        onSelectPerson={onSelectPerson}
        disabled={disabled}
        addNewPersonMode="disabled"
        display="one-line"
      />
      {organizerId &&
        (
          <Button onClick={resetFilters} className="btn btn-secondary btn-md">
            Reset
          </Button>
        )}
    </FiltersContainer>
  );
};

export default ModFilters;
