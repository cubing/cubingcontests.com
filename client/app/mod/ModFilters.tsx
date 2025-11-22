"use client";

import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext, useEffect, useState } from "react";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import type { InputPerson } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utilityFunctions.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import { getPersonByPersonIdSF } from "~/server/serverFunctions/personServerFunctions.ts";

type Props = {
  onSelectPerson: (person: PersonResponse) => void;
  onResetFilters: () => void;
  disabled: boolean;
};

const ModFilters = ({ onSelectPerson, onResetFilters, disabled }: Props) => {
  const searchParams = useSearchParams();
  const { changeErrorMessages } = useContext(MainContext);

  const { executeAsync: getPersonByPersonId, isPending } = useAction(getPersonByPersonIdSF);
  const [persons, setPersons] = useState<InputPerson[]>([null]);
  const [personNames, setPersonNames] = useState([""]);

  useEffect(() => {
    const organizerPersonId = searchParams.get("organizerPersonId");
    if (organizerPersonId) {
      (async () => {
        const res = await getPersonByPersonId({ personId: Number(organizerPersonId) });

        if (res.serverError || res.validationErrors) {
          changeErrorMessages([getActionError(res)]);
        } else {
          setPersons([res.data!]);
          setPersonNames([res.data!.name]);
        }
      })();
    }
  }, [getPersonByPersonId, searchParams, changeErrorMessages]);

  const resetFilters = () => {
    onResetFilters();
    setPersons([null]);
    setPersonNames([""]);
  };

  return (
    <FiltersContainer>
      <FormPersonInputs
        title="Organizer"
        persons={persons}
        setPersons={setPersons}
        personNames={personNames}
        setPersonNames={setPersonNames}
        onSelectPerson={onSelectPerson}
        disabled={disabled || isPending}
        addNewPersonMode="disabled"
        display="one-line"
      />
      {persons[0] && (
        <Button onClick={resetFilters} className="btn btn-secondary btn-md">
          Reset
        </Button>
      )}
    </FiltersContainer>
  );
};

export default ModFilters;
