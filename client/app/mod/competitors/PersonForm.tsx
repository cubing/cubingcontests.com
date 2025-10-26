"use client";

import { useContext, useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Form from "~/app/components/form/Form.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormCountrySelect from "~/app/components/form/FormCountrySelect.tsx";
import { fetchWcaPerson } from "~/helpers/sharedFunctions.ts";
import { PersonResponse } from "~/server/db/schema/persons.ts";
import { Creator } from "~/helpers/types.ts";
import { useAction } from "next-safe-action/hooks";
import {
  createPersonSF,
  getOrCreatePersonByWcaIdSF,
  updatePersonSF,
} from "~/server/serverFunctions/personServerFunctions.ts";
import { getActionError } from "~/helpers/utilityFunctions.ts";
import { PersonDto } from "~/helpers/validators/Person.ts";

type Props = {
  personUnderEdit: PersonResponse | undefined;
  creator: Creator | undefined;
  creatorPerson: PersonResponse | undefined;
  onSubmit: (person: PersonResponse, isNew?: boolean) => void;
  onCancel: (() => void) | undefined;
};

function PersonForm({ personUnderEdit, creator, creatorPerson, onSubmit, onCancel }: Props) {
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createPerson, isPending: isCreating } = useAction(createPersonSF);
  const { executeAsync: getOrCreateWcaPerson, isPending: isGettingOrCreatingWcaPerson } = useAction(
    getOrCreatePersonByWcaIdSF,
  );
  const { executeAsync: updatePerson, isPending: isUpdating } = useAction(updatePersonSF);
  const [nextFocusTarget, setNextFocusTarget] = useState("");
  const [name, setName] = useState(personUnderEdit?.name ?? "");
  const [localizedName, setLocalizedName] = useState(personUnderEdit?.localizedName ?? "");
  const [wcaId, setWcaId] = useState(personUnderEdit?.wcaId ?? "");
  const [hasWcaId, setHasWcaId] = useState<boolean>(personUnderEdit === undefined || !!personUnderEdit.wcaId);
  const [countryIso2, setCountryIso2] = useState(personUnderEdit?.countryIso2 ?? "NOT_SELECTED");
  const [isFetchingWcaPerson, startFetchWcaPersonTransition] = useTransition();
  // This is set to true when the user is an admin, and they attempted to set a person with a duplicate name/country combination.
  // If the person is submitted again with no changes, the request will be sent with ignoreDuplicate=true.
  const isConfirmation = useRef(false);

  const isPending = isCreating || isGettingOrCreatingWcaPerson || isUpdating || isFetchingWcaPerson;

  useEffect(() => {
    if (nextFocusTarget) {
      document.getElementById(nextFocusTarget)?.focus();
      setNextFocusTarget("");
    }
    // These dependencies are required so that it focuses AFTER everything has been rerendered
  }, [nextFocusTarget, name, localizedName, wcaId, hasWcaId, countryIso2, isPending]);

  useEffect(() => {
    if (isConfirmation.current) isConfirmation.current = false;
  }, [name, countryIso2, wcaId, hasWcaId]);

  const handleSubmit = async () => {
    const baseRequest = {
      newPersonDto: {
        name: name.trim(),
        localizedName: localizedName.trim() || undefined,
        wcaId: hasWcaId ? wcaId.trim().toUpperCase() : undefined,
        countryIso2,
      } satisfies PersonDto,
      ignoreDuplicate: isConfirmation.current,
    };

    const res = personUnderEdit
      ? await updatePerson({ ...baseRequest, id: personUnderEdit.id })
      : await createPerson(baseRequest);

    if (res.serverError || res.validationErrors) {
      if (res.serverError?.data?.isDuplicatePerson) isConfirmation.current = true;
      changeErrorMessages([getActionError(res)]);
    } else {
      afterSubmit(res.data!);
    }
  };

  const afterSubmit = (newPerson: PersonResponse) => {
    const redirect = searchParams.get("redirect");

    reset();
    changeSuccessMessage(
      `${newPerson.name} successfully ${personUnderEdit ? "updated" : "added"}${redirect ? ". Going back..." : ""}`,
    );

    // Redirect if there is a redirect parameter in the URL, otherwise focus the first input
    if (!redirect) {
      onSubmit(newPerson, !personUnderEdit);

      if (hasWcaId) setNextFocusTarget("wca_id");
      else setNextFocusTarget("full_name");
    } else {
      throw new Error("NOT IMPLEMENTED: ADD BUTTON THAT REDIRECTS BACK AND FOCUS IT");
      // setTimeout(() => window.location.href = redirect, 2000);
    }
  };

  const changeWcaId = async (newWcaId: string) => {
    newWcaId = newWcaId.trim().toUpperCase();

    if (/[^A-Z0-9]/.test(newWcaId)) {
      changeErrorMessages(["A WCA ID can only have alphanumeric characters"]);
    } else if (newWcaId.length <= 10) {
      setWcaId(newWcaId);

      if (!personUnderEdit) reset(true);

      if (newWcaId.length === 10) {
        if (!personUnderEdit) {
          const res = await getOrCreateWcaPerson({ wcaId: newWcaId });

          if (res.serverError || res.validationErrors) {
            changeErrorMessages([getActionError(res)]);
          } else if (res.data?.isNew) {
            afterSubmit(res.data.person);
          } else {
            changeErrorMessages(["A competitor with this WCA ID already exists"]);
            setName(res.data!.person.name);
            setLocalizedName(res.data!.person.localizedName ?? "");
            setCountryIso2(res.data!.person.countryIso2);
          }

          setNextFocusTarget("wca_id");
        } else {
          startFetchWcaPersonTransition(async () => {
            const wcaPerson = await fetchWcaPerson(newWcaId);

            if (!wcaPerson) {
              changeErrorMessages([`Person with WCA ID ${newWcaId} not found`]);
              setNextFocusTarget("wca_id");
            } else {
              resetMessages();
              setName(wcaPerson.name);
              setLocalizedName(wcaPerson.localizedName ?? "");
              setCountryIso2(wcaPerson.countryIso2);
              setNextFocusTarget("form_submit_button");
            }
          });
        }
      }
    }
  };

  const changeHasWcaId = (noWcaId: boolean) => {
    resetMessages();
    setHasWcaId(!noWcaId);

    if (noWcaId) {
      setWcaId("");
      setNextFocusTarget("full_name");
    } else {
      if (!personUnderEdit) reset();
      setNextFocusTarget("wca_id");
    }
  };

  const reset = (exceptWcaId = false) => {
    setName("");
    setLocalizedName("");
    setCountryIso2("NOT_SELECTED");
    if (!exceptWcaId) setWcaId("");
  };

  return (
    <Form
      buttonText="Submit"
      onSubmit={handleSubmit}
      showCancelButton={onCancel !== undefined}
      onCancel={onCancel}
      hideToasts // they're shown on the page itself
      hideControls={hasWcaId && !personUnderEdit}
      disableControls={isPending}
      isLoading={isCreating || isUpdating}
    >
      {personUnderEdit && (
        <CreatorDetails
          creator={creator}
          person={creatorPerson}
          createdExternally={(personUnderEdit as any).createdExternally}
        />
      )}
      {personUnderEdit && <p>CC ID: {personUnderEdit.personId}</p>}
      <FormTextInput
        title="WCA ID"
        id="wca_id"
        monospace
        value={wcaId}
        setValue={changeWcaId}
        autoFocus
        disabled={isPending || !hasWcaId}
        className="mb-2"
      />
      <FormCheckbox
        title="Competitor doesn't have a WCA ID"
        selected={!hasWcaId}
        setSelected={changeHasWcaId}
        disabled={isPending}
      />
      <FormTextInput
        title="Full Name (name, last name)"
        id="full_name"
        value={name}
        setValue={setName}
        nextFocusTargetId="localized_name"
        disabled={isPending || hasWcaId}
        className="mb-3"
      />
      <FormTextInput
        title="Localized Name (optional)"
        id="localized_name"
        value={localizedName}
        setValue={setLocalizedName}
        nextFocusTargetId="country_iso_2"
        disabled={isPending || hasWcaId}
        className="mb-3"
      />
      <FormCountrySelect
        countryIso2={countryIso2}
        setCountryIso2={setCountryIso2}
        nextFocusTargetId="form_submit_button"
        disabled={isPending || hasWcaId}
      />
    </Form>
  );
}

export default PersonForm;
