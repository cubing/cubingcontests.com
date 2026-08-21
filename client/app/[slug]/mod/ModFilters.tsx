"use client";

import { useAction } from "next-safe-action/hooks";
import { useContext, useState } from "react";
import { type ModDashboardStateFilterValue, useModDashboardQueryState } from "~/app/[slug]/mod/ModDashboardFilters.ts";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import type { InputPerson } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import { getPersonByIdSF } from "~/server/server-functions/person-server-functions.ts";

type Props = {
  initOrganizerPerson: PersonResponse | undefined;
  isAdminView: boolean;
  disabled: boolean;
};

function ModFilters({ initOrganizerPerson, isAdminView, disabled }: Props) {
  const { changeErrorMessages } = useContext(MainContext);

  const { executeAsync: getPersonById, isPending: isGettingPerson } = useAction(getPersonByIdSF);
  const [{ organizerPersonId, state }, setFilters] = useModDashboardQueryState();
  const [persons, setPersons] = useState<InputPerson[]>([initOrganizerPerson ?? null]);
  const [personNames, setPersonNames] = useState([initOrganizerPerson?.name ?? ""]);

  const stateOptions: MultiChoiceOption<ModDashboardStateFilterValue | null>[] = [
    { value: null, label: "Any" },
    { value: "pending", label: "Pending", disabled: !isAdminView },
    { value: "created", label: isAdminView ? "Created" : "Pending approval" },
    { value: "approved", label: "Approved" },
    { value: "ongoing", label: "Ongoing" },
    { value: "finished", label: isAdminView ? "Finished" : "Pending review" },
    { value: "published", label: "Published" },
    { value: "removed", label: "Removed", disabled: !isAdminView },
  ];

  const selectPerson = async (newPersonId: number) => {
    const res = await getPersonById({ id: newPersonId });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      setPersons([res.data!]);
      setPersonNames([res.data!.name]);
      setFilters({ organizerPersonId: newPersonId });
    }
  };

  const resetFilters = () => {
    setPersons([null]);
    setPersonNames([""]);
    setFilters({ organizerPersonId: null, state: null });
  };

  return (
    <FiltersContainer className="mb-2">
      <FormPersonInputs
        title="Organizer"
        persons={persons}
        setPersons={setPersons}
        personNames={personNames}
        setPersonNames={setPersonNames}
        onSelectPerson={(val) => selectPerson(val.id)}
        disabled={disabled || isGettingPerson}
        addNewPersonMode="disabled"
        display="one-line"
      />
      <FormSelect
        title="State"
        options={stateOptions}
        selected={state}
        setSelected={(val) => setFilters({ state: val as ModDashboardStateFilterValue })}
        oneLine
      />
      {(organizerPersonId || state) && (
        <Button onClick={resetFilters} className="btn-secondary btn-sm">
          Reset
        </Button>
      )}
    </FiltersContainer>
  );
}

export default ModFilters;
