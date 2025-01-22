"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMyFetch } from "~/helpers/customHooks.ts";
import { IFePerson, IWcaPersonDto } from "@cc/shared";
import Form from "~/app/components/form/Form.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormCountrySelect from "~/app/components/form/FormCountrySelect.tsx";
import { fetchWcaPerson } from "@cc/shared";

type Props = {
  personUnderEdit: IFePerson | undefined;
  onSubmit: (person: IFePerson, isNew?: boolean) => void;
  onCancel: (() => void) | undefined;
};

const PersonForm = ({
  personUnderEdit,
  onSubmit,
  onCancel,
}: Props) => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeErrorMessages, changeSuccessMessage, loadingId, changeLoadingId, resetMessagesAndLoadingId } =
    useContext(MainContext);

  const [nextFocusTarget, setNextFocusTarget] = useState("");
  const [name, setName] = useState(personUnderEdit?.name ?? "");
  const [localizedName, setLocalizedName] = useState(personUnderEdit?.localizedName ?? "");
  const [wcaId, setWcaId] = useState(personUnderEdit?.wcaId ?? "");
  const [hasWcaId, setHasWcaId] = useState<boolean>(personUnderEdit === undefined || !!personUnderEdit.wcaId);
  const [countryIso2, setCountryIso2] = useState(personUnderEdit?.countryIso2 ?? "NOT_SELECTED");
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
      wcaId: hasWcaId ? wcaId : undefined,
      countryIso2,
    };
    const extra = isConfirmation.current ? "?ignoreDuplicate=true" : "";

    const { payload, errors } = personUnderEdit
      ? await myFetch.patch(
        `/persons/${(personUnderEdit as any)._id}${extra}`,
        newPerson,
        { loadingId: "form_submit_button" },
      )
      : await myFetch.post(`/persons/no-wcaid${extra}`, newPerson, { loadingId: "form_submit_button" });

    if (!errors) {
      afterSubmit(payload);
    } else if (errors[0] === "DUPLICATE_PERSON_ERROR") {
      isConfirmation.current = true;
      changeErrorMessages([
        "A person with the same name and country already exists. If it's actually a different competitor with the same name, simply submit them again.",
      ]);
    }
  };

  const afterSubmit = (newPerson: IFePerson) => {
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
      setTimeout(() => window.location.replace(redirect), 1000); // 1 second delay
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
          const { payload } = await myFetch.get<IWcaPersonDto>(`/persons/${newWcaId}`, { authorize: true });

          if (payload) {
            if (payload.isNew) {
              afterSubmit(payload.person);
            } else {
              changeErrorMessages(["A competitor with this WCA ID already exists"]);
              setName(payload.person.name);
              setLocalizedName(payload.person.localizedName ?? "");
              setCountryIso2(payload.person.countryIso2);
            }
          }

          setNextFocusTarget("wca_id");
        } else {
          changeLoadingId("...");
          const wcaPerson = await fetchWcaPerson(newWcaId);

          if (!wcaPerson) {
            changeErrorMessages([`Person with WCA ID ${newWcaId} not found`]);
            setNextFocusTarget("wca_id");
          } else {
            resetMessagesAndLoadingId();
            setName(wcaPerson.name);
            setLocalizedName(wcaPerson.localizedName ?? "");
            setCountryIso2(wcaPerson.countryIso2);
            setNextFocusTarget("form_submit_button");
          }
        }
      }
    }
  };

  const changeHasWcaId = (noWcaId: boolean) => {
    resetMessagesAndLoadingId();
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
      hideToasts
      hideButton={hasWcaId && !personUnderEdit}
      showCancelButton={onCancel !== undefined}
      onCancel={onCancel}
    >
      {personUnderEdit && <CreatorDetails creator={personUnderEdit.creator} />}
      {personUnderEdit && <p>CC ID: {personUnderEdit.personId}</p>}
      <FormTextInput
        title="WCA ID"
        id="wca_id"
        monospace
        value={wcaId}
        setValue={changeWcaId}
        autoFocus
        disabled={loadingId !== "" || !hasWcaId}
        className="mb-2"
      />
      <FormCheckbox
        title="Competitor doesn't have a WCA ID"
        selected={!hasWcaId}
        setSelected={changeHasWcaId}
        disabled={loadingId !== ""}
      />
      <FormTextInput
        title="Full Name (name, last name)"
        id="full_name"
        value={name}
        setValue={setName}
        nextFocusTargetId="localized_name"
        disabled={loadingId !== "" || hasWcaId}
        className="mb-3"
      />
      <FormTextInput
        title="Localized Name (optional)"
        id="localized_name"
        value={localizedName}
        setValue={setLocalizedName}
        nextFocusTargetId="country_iso_2"
        disabled={loadingId !== "" || hasWcaId}
        className="mb-3"
      />
      <FormCountrySelect
        countryIso2={countryIso2}
        setCountryIso2={setCountryIso2}
        nextFocusTargetId="form_submit_button"
        disabled={loadingId !== "" || hasWcaId}
      />
    </Form>
  );
};

export default PersonForm;
