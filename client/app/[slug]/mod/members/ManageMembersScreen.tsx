"use client";

import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAction } from "next-safe-action/hooks";
import { useContext, useMemo, useState } from "react";
import Competitor from "~/app/components/Competitor.tsx";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import type { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import type { InputPerson } from "~/helpers/types.ts";
import { getActionError, getHasRole, getSimplifiedString } from "~/helpers/utility-functions.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import { type OrganizationRole, orgRolesObject } from "~/server/organization-permissions.ts";
import { removeMemberSF, updateMemberSF } from "~/server/server-functions/user-server-functions.ts";

type Props = {
  members: (typeof authClient.$Infer.Member)[];
  memberPersons: PersonResponse[];
  videoBasedResultsEnabled: boolean;
};

function ManageMembersScreen({
  members: initMembers,
  memberPersons: initMemberPersons,
  videoBasedResultsEnabled,
}: Props) {
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);
  const { member, organization } = useSession();

  const { executeAsync: updateMember, isPending: isUpdating } = useAction(updateMemberSF);
  const { executeAsync: removeMember, isPending: isRemoving } = useAction(removeMemberSF);
  const [members, setMembers] = useState(initMembers);
  const [memberPersons, setMemberPersons] = useState(initMemberPersons);
  const [memberId, setMemberId] = useState<string>();
  const [name, setName] = useState(""); // for email + password users this is the same as the username
  const [email, setEmail] = useState("");
  const [personNames, setPersonNames] = useState([""]);
  const [persons, setPersons] = useState<InputPerson[]>([null]);
  const [isMember, setIsMember] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isVideoBasedResultReviewer, setIsVideoBasedResultReviewer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState("");

  const filteredMembers = useMemo(() => {
    const simplifiedSearch = getSimplifiedString(search);

    return members.filter(
      (m) =>
        m.user.name.toLocaleLowerCase().includes(simplifiedSearch) ||
        m.user.email.toLocaleLowerCase().includes(simplifiedSearch) ||
        getSimplifiedString(memberPersons.find((p) => p.id === m.personId)?.name ?? "").includes(simplifiedSearch),
    );
  }, [search, members, memberPersons]);

  const isPending = isUpdating || isRemoving;

  const handleSubmit = async () => {
    if (persons[0] === null && personNames[0].trim() !== "") {
      changeErrorMessages(["The competitor has not been entered. Either enter them or clear the input."]);
      return;
    }

    const roles: OrganizationRole[] = [];
    if (isMember) roles.push("member");
    if (isMod) roles.push("mod");
    if (isVideoBasedResultReviewer) roles.push("videoBasedResultReviewer");
    if (isAdmin) roles.push("admin");
    if (isOwner) roles.push("owner");

    const res = await updateMember({ id: memberId!, personId: persons[0]?.id, roles });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      resetMessages();
      setMemberId(undefined);
      setName("");
      const { member, person } = res.data!;
      setMembers(
        members.map((m) =>
          m.id === memberId
            ? { ...member, role: member.role as OrganizationRole, user: m.user, personId: member.personId ?? undefined }
            : m,
        ),
      );
      if (person && !memberPersons.some((p) => p.id === person.id)) setMemberPersons([...memberPersons, person]);
    }
  };

  const onEditMember = (member: typeof authClient.$Infer.Member) => {
    window.scrollTo(0, 0);
    resetMessages();

    setMemberId(member.id);
    setName(member.user.name);
    setEmail(member.user.email);

    if (!member.role) throw new Error("Error: role is empty");

    const person = member.personId ? memberPersons.find((p) => p.id === member.personId) : undefined;

    // We always want to set the member role when the person profile is linked
    setIsMember(getHasRole("member", member.role) || person !== undefined);
    setIsMod(getHasRole("mod", member.role));
    setIsVideoBasedResultReviewer(getHasRole("videoBasedResultReviewer", member.role));
    setIsAdmin(getHasRole("admin", member.role));
    setIsOwner(getHasRole("owner", member.role));

    if (person) {
      setPersons([person]);
      setPersonNames([person.name]);
    } else {
      setPersons([null]);
      setPersonNames([""]);
    }
  };

  const onRemoveMember = async (member: typeof authClient.$Infer.Member) => {
    resetMessages();

    if (confirm(`Are you sure you would like to remove member ${member.user.name} from ${organization!.name}?`)) {
      setLoadingId(`delete_member_${member.id}_button`);

      const res = await removeMember({ id: member.id });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else {
        changeSuccessMessage(`Successfully removed member ${member.user.name} from ${organization!.name}`);
        setMembers(members.filter((m) => m.id !== member.id));
      }
      setLoadingId("");
    }
  };

  return (
    <>
      {name && (
        <Form onSubmit={handleSubmit} hideToasts onCancel={() => setName("")} isLoading={isPending}>
          <div className="row mb-3">
            <div className="col">
              <FormTextInput title="Name" value={name} disabled />
            </div>
            <div className="col">
              <FormTextInput title="Email" value={email} disabled />
            </div>
          </div>
          <FormPersonInputs
            title="Competitor"
            persons={persons}
            setPersons={setPersons}
            personNames={personNames}
            setPersonNames={setPersonNames}
            disabled={isPending}
            onSelectPerson={() => setIsMember(true)}
            addNewPersonMode="default"
            display="grid"
          />
          <h5 className="mt-3 mb-3">Roles</h5>
          <FormCheckbox
            title={orgRolesObject.member}
            checked={isMember}
            setChecked={setIsMember}
            disabled={isPending || isMember} // removing this role isn't allowed
            className="mb-3"
          />
          <FormCheckbox
            title={orgRolesObject.mod}
            checked={isMod}
            setChecked={setIsMod}
            disabled={isPending}
            className="mb-3"
          />
          {videoBasedResultsEnabled && (
            <FormCheckbox
              title={orgRolesObject.videoBasedResultReviewer}
              checked={isVideoBasedResultReviewer}
              setChecked={setIsVideoBasedResultReviewer}
              disabled={isPending}
              className="mb-3"
            />
          )}
          <FormCheckbox
            title={orgRolesObject.admin}
            checked={isAdmin}
            setChecked={setIsAdmin}
            disabled={isPending}
            className="mb-3"
          />
          <FormCheckbox
            title={orgRolesObject.owner}
            checked={isOwner}
            setChecked={setIsOwner}
            disabled
            className="mb-3"
          />
        </Form>
      )}

      <div className="px-2">
        <FiltersContainer className="mt-4 mb-2">
          <FormTextInput title="Search" value={search} setValue={setSearch} oneLine />
        </FiltersContainer>
        <p className="text-secondary">Search by name, username, email or competitor name</p>

        <p className="mb-2">
          Number of members:&nbsp;<b>{filteredMembers.length}</b>
        </p>
      </div>

      <div className="table-responsive mt-3">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Competitor</th>
              <th scope="col">Roles</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((m, index) => {
              const person = memberPersons.find((p) => p.id === m.personId);
              const roles = m
                .role!.split(",")
                .map((role) => (orgRolesObject as any)[role])
                .join(", ");

              return (
                <tr key={m.id}>
                  <td>{index + 1}</td>
                  <td className="text-truncate" style={{ maxWidth: "20rem" }}>
                    {m.user.name}
                  </td>
                  <td>{m.user.email}</td>
                  <td>{person && <Competitor person={person} noFlag />}</td>
                  <td>{roles}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        onClick={() => onEditMember(m)}
                        className="btn-xs"
                        title="Edit member"
                        ariaLabel="Edit member"
                      >
                        <FontAwesomeIcon icon={faPencil} />
                      </Button>
                      {member && m.id !== member.id && (
                        <Button
                          id={`delete_member_${m.id}_button`}
                          onClick={() => onRemoveMember(m)}
                          loadingId={loadingId}
                          disabled={isPending}
                          className="btn-danger btn-xs"
                          title="Remove member"
                          ariaLabel="Remove member"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ManageMembersScreen;
