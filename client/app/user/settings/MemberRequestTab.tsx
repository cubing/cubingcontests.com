"use client";

import { useAction } from "next-safe-action/hooks";
import { useContext, useRef, useState } from "react";
import Markdown from "react-markdown";
import useSWR from "swr";
import PersonForm from "~/app/[slug]/mod/competitors/PersonForm.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextArea from "~/app/components/form/FormTextArea.tsx";
import Button from "~/app/components/UI/Button.tsx";
import Modal from "~/app/components/UI/Modal.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import type { InputPerson, MemberRequestDetails } from "~/helpers/types.ts";
import { getActionError, getHasRole } from "~/helpers/utility-functions.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";
import { orgRolesObject, requestableRoles } from "~/server/organization-permissions.ts";
import {
  createOrUpdateMemberRequestSF,
  deleteMemberRequestSF,
} from "~/server/server-functions/user-server-functions.ts";

type Props = {
  regions: RegionResponse[];
};

function MemberRequestTab({ regions }: Props) {
  const { member } = useSession();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createOrUpdateMemberRequest, isPending: isCreating } = useAction(createOrUpdateMemberRequestSF);
  const { executeAsync: deleteMemberRequest, isPending: isDeleting } = useAction(deleteMemberRequestSF);
  const { data: memberRequestDetails, mutate } = useSWR<MemberRequestDetails>(SwrKey.MemberRequestDetails, {
    suspense: true,
  });
  const memberRequest = memberRequestDetails?.memberRequest;
  const { data: memberRequestInstructions } = useSWR<string>(SwrKey.MemberRequestInstructions, { suspense: true });
  const [persons, setPersons] = useState<InputPerson[]>([memberRequest?.requestedPerson ?? null]);
  const [personNames, setPersonNames] = useState([memberRequest?.requestedPerson?.name ?? ""]);
  const [requestedRole, setRequestedRole] = useState<(typeof roleOptions)[number]["value"]>(
    memberRequest ? (memberRequest.requestedRole as any) : null,
  );
  const [comment, setComment] = useState(memberRequest?.comment ?? "");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const roleOptions = [
    { value: null, label: "Not selected" },
    ...requestableRoles.map((r) => ({ value: r, label: orgRolesObject[r] })),
  ] as const satisfies MultiChoiceOption[];
  const isAdmin = getHasRole("admin", member?.role) || getHasRole("owner", member?.role);
  const isPending = isCreating || isDeleting;

  const handleSubmit = async () => {
    if (personNames[0] && !persons[0]) {
      changeErrorMessages(["Please enter or clear the competitor profile"]);
    } else {
      resetMessages();
      const res = await createOrUpdateMemberRequest({
        requestedPersonId: persons[0]?.id ?? null,
        requestedRole,
        comment: comment || null,
      });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else {
        changeSuccessMessage("Your request has been successfully submitted. The admin team will review it soon.");
        mutate(res.data!, { revalidate: false });
      }
    }
  };

  const onDelete = async () => {
    resetMessages();
    const res = await deleteMemberRequest(memberRequest!.id);

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      changeSuccessMessage("Your request has been successfully deleted");
      mutate(
        { memberRequest: null, ownRequestedPersonId: memberRequestDetails?.ownRequestedPersonId },
        { revalidate: false },
      );
      setPersons([null]);
      setPersonNames([""]);
      setRequestedRole(null);
      setComment("");
    }
  };

  const openPersonModal = () => {
    resetMessages();
    dialogRef.current!.showModal();
  };

  const onSubmitPerson = (person: PersonResponse) => {
    dialogRef.current!.close();
    setPersons([person]);
    setPersonNames([person.name]);
  };

  return (
    <>
      <Markdown>{memberRequestInstructions}</Markdown>

      <Form
        onSubmit={handleSubmit}
        isLoading={isCreating}
        disableControls={isPending || isAdmin}
        hideToasts
        className="mt-4 mb-5"
      >
        {isAdmin && (
          <p className="fs-6 fw-bold text-center text-danger">You cannot submit requests, because you are an admin</p>
        )}

        <div className="row mb-2">
          <div className="col-12 col-md-6">
            <FormPersonInputs
              title="Requested competitor profile"
              persons={persons}
              setPersons={setPersons}
              personNames={personNames}
              setPersonNames={setPersonNames}
              regions={regions}
              disabled={isPending || !!memberRequest?.requestedPersonId || !!member!.personId}
              addNewPersonMode="disabled"
              display="grid"
              showWcaId
            />
            {!member!.personId &&
              (!persons[0] ? (
                <Button onClick={() => openPersonModal()} className="btn-success my-2">
                  Create New Person
                </Button>
              ) : persons[0].id === memberRequestDetails?.ownRequestedPersonId ? (
                <Button onClick={() => openPersonModal()} className="btn-primary my-2">
                  Edit Person
                </Button>
              ) : undefined)}
          </div>
          <div className="col-12 col-md-6">
            <FormSelect
              title="Requested role"
              options={roleOptions}
              selected={requestedRole}
              setSelected={setRequestedRole as any}
              disabled={isPending || member!.role !== "member"}
            />
          </div>
        </div>
        <FormTextArea
          title="Comment"
          value={comment}
          setValue={setComment}
          disabled={isPending}
          rows={5}
          className="mb-3"
        />
      </Form>

      {memberRequest && (
        <>
          <p>
            You have already submitted a request. To change the details, simply submit again. If you would like to
            request a different competitor profile, delete your request and submit a new one.
          </p>
          <Button onClick={() => onDelete()} isLoading={isDeleting} disabled={isPending} className="btn-danger mb-4">
            Delete Request
          </Button>
        </>
      )}

      <Modal ref={dialogRef} title={persons[0] ? "Edit Person" : "Create New Person"}>
        <p className="fw-bold mb-1 text-danger">
          If you have a WCA ID, please close this window and simply enter it into the main input.
        </p>
        <p>Only use this for submitting a new competitor profile without a WCA ID.</p>
        <PersonForm
          key={persons[0]?.id}
          personUnderEdit={persons[0] ?? undefined}
          regions={regions}
          onSubmit={onSubmitPerson}
          onSubmitError={() => dialogRef.current!.close()}
          wcaIdInputHidden
        />
      </Modal>
    </>
  );
}

export default MemberRequestTab;
