"use client";

import { useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createPersonSF } from "~/server/persons/personsServerFunctions.ts";
import { getActionError } from "~/helpers/utilityFunctions.ts";

type Props = {
  personUnderEdit: PersonResponse | undefined;
  creator: Creator | undefined;
  onSubmit: (person: PersonResponse, isNew?: boolean) => void;
  onCancel: (() => void) | undefined;
};

const PersonForm = ({
  personUnderEdit,
  creator,
  onSubmit,
  onCancel,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createPerson, isPending } = useAction(createPersonSF);
  const [nextFocusTarget, setNextFocusTarget] = useState("");
  const [name, setName] = useState(personUnderEdit?.name ?? "");
  const [localizedName, setLocalizedName] = useState(personUnderEdit?.localizedName ?? "");
  const [wcaId, setWcaId] = useState(personUnderEdit?.wcaId ?? "");
  const [hasWcaId, setHasWcaId] = useState<boolean>(personUnderEdit === undefined || !!personUnderEdit.wcaId);
  const [countryIso2, setCountryIso2] = useState(personUnderEdit?.countryIso2 ?? "NOT_SELECTED");
  const [isPendingWcaId, startWcaIdTransition] = useTransition();
  // This is set to true when the user is an admin, and they attempted to set a person with a duplicate name/country combination.
  // If the person is submitted again with no changes, the request will be sent with ignoreDuplicate=true.
  const isConfirmation = useRef(false);

  useEffect(() => {
    if (nextFocusTarget) {
      document.getElementById(nextFocusTarget)?.focus();
      setNextFocusTarget("");
    }
    // These dependencies are required so that it focuses AFTER everything has been rerendered
  }, [nextFocusTarget, wcaId, name, localizedName, countryIso2, hasWcaId]);

  useEffect(() => {
    if (isConfirmation.current) isConfirmation.current = false;
  }, [name, countryIso2]);

  const handleSubmit = async () => {
    const newPerson = {
      name: name.trim(),
      localizedName: localizedName.trim() || undefined,
      wcaId: hasWcaId ? wcaId.trim().toUpperCase() : undefined,
      countryIso2,
    };
    // const extra = isConfirmation.current ? "?ignoreDuplicate=true" : "";

    // const res = personUnderEdit
    //   ? await myFetch.patch(
    //     `/persons/${(personUnderEdit as any)._id}${extra}`,
    //     newPerson,
    //   )
    //   : await myFetch.post(`/persons/no-wcaid${extra}`, newPerson);
    const res = await createPerson({ newPerson });

    if (!res?.data) {
      if (res?.serverError?.data?.isDuplicatePerson) isConfirmation.current = true;
      changeErrorMessages([getActionError(res)]);
    } else {
      afterSubmit(res.data);
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
      console.error("NOT IMPLEMENTED: ADD BUTTON THAT REDIRECTS BACK AND FOCUS IT");
      // setTimeout(() => window.location.replace(redirect), 2000);
    }
  };

  const changeWcaId = async (newWcaId: string) => {
    // newWcaId = newWcaId.trim().toUpperCase();

    // if (/[^A-Z0-9]/.test(newWcaId)) {
    //   changeErrorMessages(["A WCA ID can only have alphanumeric characters"]);
    // } else if (newWcaId.length <= 10) {
    //   setWcaId(newWcaId);

    //   if (!personUnderEdit) reset(true);

    //   if (newWcaId.length === 10) {
    //     startWcaIdTransition(async () => {
    //       if (!personUnderEdit) {
    //         const res = await getOrCreatePersonByWcaIdSF(newWcaId);
    //         // const res = await myFetch.get<IWcaPersonDto>(`/persons/${newWcaId}`, { authorize: true });

    //         if (!res.success) {
    //           if (res.error.code === "NOT_FOUND") {
    //             changeErrorMessages([]);
    //           }
    //         } else if (res.success) {
    //           if (res.data.isNew) {
    //             afterSubmit(res.data.person);
    //           } else {
    //             changeErrorMessages(["A competitor with this WCA ID already exists"]);
    //             setName(res.data.person.name);
    //             setLocalizedName(res.data.person.localizedName ?? "");
    //             setCountryIso2(res.data.person.countryIso2);
    //           }
    //         }

    //         setNextFocusTarget("wca_id");
    //       } else {
    //         const wcaPerson = await fetchWcaPerson(newWcaId);

    //         if (!wcaPerson) {
    //           changeErrorMessages([`Person with WCA ID ${newWcaId} not found`]);
    //           setNextFocusTarget("wca_id");
    //         } else {
    //           resetMessages();
    //           setName(wcaPerson.name);
    //           setLocalizedName(wcaPerson.localizedName ?? "");
    //           setCountryIso2(wcaPerson.countryIso2);
    //           setNextFocusTarget("form_submit_button");
    //         }
    //       }
    //     });
    //   }
    // }
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
      hideToasts
      hideControls={hasWcaId && !personUnderEdit}
      isLoading={isPending}
    >
      {personUnderEdit && (
        <CreatorDetails
          user={creator}
          person={personUnderEdit}
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
        disabled={isPendingWcaId || !hasWcaId || isPending}
        className="mb-2"
      />
      <FormCheckbox
        title="Competitor doesn't have a WCA ID"
        selected={!hasWcaId}
        setSelected={changeHasWcaId}
        disabled={isPendingWcaId || isPending}
      />
      <FormTextInput
        title="Full Name (name, last name)"
        id="full_name"
        value={name}
        setValue={setName}
        nextFocusTargetId="localized_name"
        disabled={isPendingWcaId || hasWcaId || isPending}
        className="mb-3"
      />
      <FormTextInput
        title="Localized Name (optional)"
        id="localized_name"
        value={localizedName}
        setValue={setLocalizedName}
        nextFocusTargetId="country_iso_2"
        disabled={isPendingWcaId || hasWcaId || isPending}
        className="mb-3"
      />
      <FormCountrySelect
        countryIso2={countryIso2}
        setCountryIso2={setCountryIso2}
        nextFocusTargetId="form_submit_button"
        disabled={isPendingWcaId || hasWcaId || isPending}
      />
    </Form>
  );
};

export default PersonForm;
