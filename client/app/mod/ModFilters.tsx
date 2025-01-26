import { IFePerson, IPerson } from "@cc/shared";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormPersonInputs from "~/app/components/form/FormPersonInputs";
import Button from "~/app/components/UI/Button";
import { useMyFetch } from "~/helpers/customHooks";
import { InputPerson, UserInfo } from "~/helpers/types";
import { getUserInfo } from "~/helpers/utilityFunctions";

const userInfo: UserInfo = getUserInfo();

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
      myFetch.get<IFePerson>(`/persons?personId=${organizerId}`).then(({ payload }) => {
        if (payload) {
          setPersons([payload]);
          setPersonNames([payload.name]);
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
    <div className="d-flex flex-wrap align-items-start column-gap-3 mb-3 px-2">
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
    </div>
  );
};

export default ModFilters;
