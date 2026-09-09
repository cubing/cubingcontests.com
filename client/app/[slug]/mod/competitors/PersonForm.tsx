"use client";

import pick from "lodash/pick";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormRegionSelect from "~/app/components/form/FormRegionSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Person from "~/app/components/Person.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { Creator, InputPerson } from "~/helpers/types.ts";
import { clientGetHasPermission, getActionError } from "~/helpers/utility-functions.ts";
import type { PersonDto } from "~/helpers/validators/Person.ts";
import type { PersonResponse, SelectPerson } from "~/server/db/schema/persons.ts";
import {
  createPersonSF,
  getOrCreatePersonByWcaIdSF,
  mergePersonsSF,
  updatePersonSF,
} from "~/server/server-functions/person-server-functions.ts";

type Props = {
  personUnderEdit: PersonResponse | undefined; // undefined means we're creating a new person
  creator?: Creator | null; // null means the user has been deleted
  onSubmit: (person: SelectPerson, { isNew }: { isNew: boolean }) => void;
  onSubmitError?: () => void;
  onCancel?: () => void;
  wcaIdInputHidden?: boolean;
  onMerged?: (mergedPerson: SelectPerson, deletedPersonId: number) => void;
};

function PersonForm({
  personUnderEdit,
  creator,
  onSubmit,
  onSubmitError,
  onCancel,
  wcaIdInputHidden,
  onMerged,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createPerson, isPending: isCreating } = useAction(createPersonSF);
  const { executeAsync: getOrCreateWcaPerson, isPending: isGettingOrCreatingWcaPerson } =
    useAction(getOrCreatePersonByWcaIdSF);
  const { executeAsync: updatePerson, isPending: isUpdating } = useAction(updatePersonSF);
  const { executeAsync: mergePersons, isPending: isMerging } = useAction(mergePersonsSF);
  const { data: canApprovePersons } = useSWR(
    session?.activeOrganizationId ? [SwrKey.CanApprovePersons, session] : null,
    () => clientGetHasPermission({ persons: ["approve"] }),
  );
  const [name, setName] = useState(personUnderEdit?.name ?? "");
  const [localizedName, setLocalizedName] = useState(personUnderEdit?.localizedName ?? "");
  const [wcaId, setWcaId] = useState(personUnderEdit?.wcaId ?? "");
  const [hasWcaId, setHasWcaId] = useState<boolean>(!wcaIdInputHidden && (!personUnderEdit || !!personUnderEdit.wcaId));
  const [regionCode, setRegionCode] = useState(personUnderEdit?.regionCode ?? C.notSelectedOption);
  // This is set to true when the user is an admin, and they attempted to set a person with a duplicate name/country combination.
  // If the person is submitted again with no changes, the request will be sent with ignoreDuplicate=true.
  const isConfirmation = useRef(false);

  // Merge state
  const [showMergeUI, setShowMergeUI] = useState(false);
  const [mergePersonsList, setMergePersonsList] = useState<InputPerson[]>([null]); // this will always have a single element
  const [mergePersonNames, setMergePersonNames] = useState<string[]>([""]);

  const isPending = isCreating || isGettingOrCreatingWcaPerson || isUpdating || isMerging;

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

  const handleMerge = async () => {
    const personToMergeWith = mergePersonsList[0];
    if (!personToMergeWith) {
      changeErrorMessages(["Please select a person to merge with"]);
      return;
    }
    if (personToMergeWith.id === personUnderEdit!.id) {
      changeErrorMessages(["The same person profile cannot be selected"]);
      return;
    }

    resetMessages();

    if (
      confirm(
        `Are you sure you would like to merge these person profiles: ${personUnderEdit!.name} (ID: ${personUnderEdit!.id}), ${personToMergeWith.name} (ID: ${personToMergeWith.id})?`,
      )
    ) {
      const res = await mergePersons({ personId1: personUnderEdit!.id, personId2: personToMergeWith.id });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else {
        const mergedPerson = res.data!;
        const deletedPersonId = mergedPerson.id === personUnderEdit!.id ? personToMergeWith.id : personUnderEdit!.id;
        changeSuccessMessage("Successfully merged person profiles");
        onMerged!(mergedPerson, deletedPersonId);
      }
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      onCancel={onCancel}
      hideToasts // they're shown on the page itself
      hideSubmitButton={hasWcaId}
      disableControls={isPending || showMergeUI}
      isLoading={isCreating || isUpdating}
    >
      {personUnderEdit && (
        <div className="tw:mb-4 tw:flex tw:gap-2">
          <span>Person:</span>
          <Person person={personUnderEdit} noFlag showWcaLink />
          <span className="fs-6">(ID: {personUnderEdit.id})</span>
        </div>
      )}
      {personUnderEdit && creator !== undefined && (
        <CreatorDetails
          creator={creator}
          createdExternally={(personUnderEdit as any).createdExternally}
          className="tw:mb-4"
        />
      )}
      {personUnderEdit && canApprovePersons && !showMergeUI && (
        <Button onClick={() => setShowMergeUI(true)} disabled={isPending} className="btn-warning btn-sm mb-3">
          Merge with another person profile
        </Button>
      )}
      {showMergeUI && (
        <div className="mb-4 rounded border p-3">
          <h5 className="mb-2">Merge another person into this profile</h5>
          <p className="small mb-3 text-muted">
            Select the person profile to merge this profile with. The profile that was created earlier will be kept and
            updated.
          </p>
          <FormPersonInputs
            title="Profile to merge with"
            persons={mergePersonsList}
            setPersons={setMergePersonsList}
            personNames={mergePersonNames}
            setPersonNames={setMergePersonNames}
            addNewPersonMode="disabled"
            display="default"
            disabled={isMerging}
          />
          <div className="tw:mt-4 tw:flex tw:gap-2">
            <Button onClick={handleMerge} isLoading={isMerging} disabled={isPending} className="btn-sm">
              Merge
            </Button>
            <Button
              onClick={() => {
                resetMessages();
                setShowMergeUI(false);
                setMergePersonsList([null]);
                setMergePersonNames([""]);
              }}
              disabled={isPending}
              className="btn-secondary btn-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
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
            checked={!hasWcaId}
            setChecked={changeHasWcaId}
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
        title="Localized Name"
        id="localized_name"
        value={localizedName}
        setValue={setLocalizedName}
        disabled={isPending || hasWcaId}
        optional
        className="mb-3"
      />
      <FormRegionSelect regionCode={regionCode} setRegionCode={setRegionCode} disabled={isPending || hasWcaId} />
    </Form>
  );
}

export default PersonForm;
