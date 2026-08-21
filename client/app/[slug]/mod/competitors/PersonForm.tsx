"use client";

import pick from "lodash/pick";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext, useEffect, useRef, useState } from "react";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormRegionSelect from "~/app/components/form/FormRegionSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import type { Creator } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import type { PersonDto } from "~/helpers/validators/Person.ts";
import type { PersonResponse, SelectPerson } from "~/server/db/schema/persons.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";
import {
  createPersonSF,
  getOrCreatePersonByWcaIdSF,
  updatePersonSF,
} from "~/server/server-functions/person-server-functions.ts";

type Props = {
  personUnderEdit: PersonResponse | undefined; // undefined means we're creating a new person
  creator?: Creator | null; // null means the user has been deleted
  regions: RegionResponse[];
  onSubmit: (person: SelectPerson, { isNew }: { isNew: boolean }) => void;
  onSubmitError?: () => void;
  onCancel?: () => void;
  wcaIdInputHidden?: boolean;
};

function PersonForm({ personUnderEdit, creator, regions, onSubmit, onSubmitError, onCancel, wcaIdInputHidden }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createPerson, isPending: isCreating } = useAction(createPersonSF);
  const { executeAsync: getOrCreateWcaPerson, isPending: isGettingOrCreatingWcaPerson } =
    useAction(getOrCreatePersonByWcaIdSF);
  const { executeAsync: updatePerson, isPending: isUpdating } = useAction(updatePersonSF);
  const [name, setName] = useState(personUnderEdit?.name ?? "");
  const [localizedName, setLocalizedName] = useState(personUnderEdit?.localizedName ?? "");
  const [wcaId, setWcaId] = useState(personUnderEdit?.wcaId ?? "");
  const [hasWcaId, setHasWcaId] = useState<boolean>(!wcaIdInputHidden && (!personUnderEdit || !!personUnderEdit.wcaId));
  const [regionCode, setRegionCode] = useState(personUnderEdit?.regionCode ?? C.notSelectedOption);
  // This is set to true when the user is an admin, and they attempted to set a person with a duplicate name/country combination.
  // If the person is submitted again with no changes, the request will be sent with ignoreDuplicate=true.
  const isConfirmation = useRef(false);

  const isPending = isCreating || isGettingOrCreatingWcaPerson || isUpdating;

  useEffect(() => {
    if (isConfirmation.current) isConfirmation.current = false;
  }, [name, regionCode, wcaId, hasWcaId]);

  const handleSubmit = async () => {
    const baseRequest = {
      newPersonDto: {
        name: name.trim(),
        localizedName: localizedName.trim() || null,
        wcaId: hasWcaId ? wcaId.trim().toUpperCase() : null,
        regionCode,
      } satisfies PersonDto,
      ignoreDuplicate: isConfirmation.current,
    };

    const res = personUnderEdit
      ? await updatePerson({ ...baseRequest, id: personUnderEdit.id })
      : await createPerson(baseRequest);

    if (res.serverError || res.validationErrors) {
      if (res.serverError?.data?.isDuplicatePerson) isConfirmation.current = true;
      changeErrorMessages([getActionError(res)]);
      onSubmitError?.();
    } else {
      afterSubmit(res.data!);
    }
  };

  const afterSubmit = (newPerson: SelectPerson) => {
    const redirect = searchParams.get("redirect");

    reset();
    changeSuccessMessage(
      `${newPerson.name} successfully ${personUnderEdit ? "updated" : "added"}${redirect ? ". Going back..." : ""}`,
    );

    if (redirect) {
      setTimeout(() => router.push(redirect), 2000);
    } else {
      onSubmit(newPerson, { isNew: !personUnderEdit });
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
        resetMessages();

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
            setRegionCode(res.data!.person.regionCode);
          }
        } else {
          const res = await updatePerson({
            id: personUnderEdit.id,
            newPersonDto: { ...pick(personUnderEdit, "name", "localizedName", "regionCode"), wcaId: newWcaId },
          });

          if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
          else afterSubmit(res.data!);
        }
      }
    }
  };

  const changeHasWcaId = (noWcaId: boolean) => {
    resetMessages();
    setHasWcaId(!noWcaId);

    if (noWcaId) setWcaId("");
    else if (!personUnderEdit) reset();
  };

  const reset = (exceptWcaId = false) => {
    setName("");
    setLocalizedName("");
    setRegionCode(C.notSelectedOption);
    if (!exceptWcaId) setWcaId("");
  };

  return (
    <Form
      onSubmit={handleSubmit}
      onCancel={onCancel}
      hideToasts // they're shown on the page itself
      hideSubmitButton={hasWcaId}
      disableControls={isPending}
      isLoading={isCreating || isUpdating}
    >
      {personUnderEdit && creator !== undefined && (
        <CreatorDetails
          creator={creator}
          regions={regions}
          createdExternally={(personUnderEdit as any).createdExternally}
          className="mb-3"
        />
      )}
      {personUnderEdit && <p>ID: {personUnderEdit.id}</p>}
      {!wcaIdInputHidden && (
        <>
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
            className="mb-3"
          />
        </>
      )}
      <FormTextInput
        title="Full Name (name, last name)"
        id="full_name"
        value={name}
        setValue={setName}
        disabled={isPending || hasWcaId}
        className="mb-3"
      />
      <FormTextInput
        title="Localized Name (optional)"
        id="localized_name"
        value={localizedName}
        setValue={setLocalizedName}
        disabled={isPending || hasWcaId}
        className="mb-3"
      />
      <FormRegionSelect
        regionCode={regionCode}
        setRegionCode={setRegionCode}
        regions={regions}
        disabled={isPending || hasWcaId}
      />
    </Form>
  );
}

export default PersonForm;
