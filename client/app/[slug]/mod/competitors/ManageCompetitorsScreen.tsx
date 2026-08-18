"use client";

import { faCheck, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import Competitor from "~/app/components/Competitor.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Region from "~/app/components/Region.tsx";
import ActiveInactiveIcon from "~/app/components/UI/ActiveInactiveIcon.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import type { Creator, ListPageMode, SpaceType } from "~/helpers/types.ts";
import { clientGetHasPermission, getActionError, getSimplifiedString } from "~/helpers/utility-functions.ts";
import type { PersonResponse, SelectPerson } from "~/server/db/schema/persons.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";
import { approvePersonSF, deletePersonSF } from "~/server/server-functions/person-server-functions.ts";
import PersonForm from "./PersonForm.tsx";

const approvedFilterOptions: MultiChoiceOption[] = [
  { label: "Any", value: "" },
  { label: "Approved", value: "approved" },
  { label: "Not approved", value: "unapproved" },
];

type Props = {
  regions: RegionResponse[];
  spaceType: SpaceType;
  // When requested by an admin, this is type SelectPerson[]
  persons: SelectPerson[] | (PersonResponse & Pick<SelectPerson, "createdBy">)[];
  creators: Creator[];
};

function ManageCompetitorsScreen({ regions, spaceType, persons: initPersons, creators }: Props) {
  const searchParams = useSearchParams();
  const { user, session } = useSession();
  const { changeSuccessMessage, changeErrorMessages, resetMessages } = useContext(MainContext);

  const { executeAsync: deletePerson, isPending: isDeleting } = useAction(deletePersonSF);
  const { executeAsync: approvePerson, isPending: isApproving } = useAction(approvePersonSF);
  const { data: canApprovePersons } = useSWR(
    session?.activeOrganizationId ? [SwrKey.CanApprovePersons, session] : null,
    () => clientGetHasPermission({ persons: ["approve"] }),
  );
  const [mode, setMode] = useState<ListPageMode | "add-once">(searchParams.get("redirect") ? "add-once" : "view");
  const [persons, setPersons] = useState(initPersons);
  const [personUnderEdit, setPersonUnderEdit] = useState<(typeof persons)[number]>();
  const [approvedFilter, setApprovedFilter] = useState<"approved" | "unapproved" | "">("");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const parentRef = useRef<Element>(null);
  // Only used for admins. Is used to confirm approval of person with exact name and country match with a WCA person.
  const ignoredWcaMatches = useRef<{ personId: number; wcaMatches: string[] }>(undefined);
  const creator = useMemo(
    () => (personUnderEdit ? (creators.find((c) => c.userId === personUnderEdit.createdBy) ?? null) : undefined),
    [personUnderEdit, creators],
  );
  const filteredPersons = useMemo(() => {
    const simplifiedSearch = getSimplifiedString(search);

    return persons.filter((p) => {
      const passesNameFilter =
        p.id.toString() === simplifiedSearch || // search by ID
        (p.wcaId && p.wcaId.toLowerCase() === simplifiedSearch) || // search by WCA ID
        getSimplifiedString(p.name).includes(simplifiedSearch) || // search by name
        (p.localizedName && getSimplifiedString(p.localizedName).includes(simplifiedSearch)) || // search by localized name
        creators.find((c) => c.userId === p.createdBy)?.name === simplifiedSearch; // search by creator name

      const passesApprovedFilter =
        approvedFilter === "" ||
        (approvedFilter === "approved" && p.approved) ||
        (approvedFilter === "unapproved" && !p.approved);

      return passesNameFilter && passesApprovedFilter;
    });
  }, [persons, approvedFilter, search]);

  const buttonsDisabled = mode !== "view" || isDeleting || isApproving;

  const rowVirtualizer = useVirtualizer({
    count: filteredPersons.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44.7833, // UPDATE THIS IF THE TR HEIGHT IN PIXELS EVER CHANGES!
    overscan: 20,
  });

  const cancel = () => {
    setMode("view");
    resetMessages();
  };

  const onAddCompetitor = () => {
    ignoredWcaMatches.current = undefined;
    setMode("add");
    setPersonUnderEdit(undefined);
    resetMessages();
  };

  const onEditCompetitor = (person: (typeof persons)[number]) => {
    ignoredWcaMatches.current = undefined;
    resetMessages();
    setMode("edit");
    setPersonUnderEdit(person);
    window.scrollTo(0, 0);
  };

  const deleteCompetitor = async (person: (typeof persons)[number]) => {
    ignoredWcaMatches.current = undefined;
    setLoadingId(`delete_person_${person.id}_button`);
    const res = await deletePerson({ id: person.id });
    setLoadingId("");

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      setPersons(persons.filter((p) => p.id !== person.id));
      changeSuccessMessage(`Successfully deleted ${person.name} (ID: ${person.id})`);
    }
  };

  const approveCompetitor = async (person: (typeof persons)[number]) => {
    if (ignoredWcaMatches.current && person.id !== ignoredWcaMatches.current.personId) {
      ignoredWcaMatches.current = undefined;
    }

    setLoadingId(`approve_person_${person.id}_button`);
    const res = await approvePerson({ id: person.id, ignoredWcaMatches: ignoredWcaMatches.current?.wcaMatches });
    setLoadingId("");

    if (res.serverError || res.validationErrors) {
      if (res.serverError?.data) {
        ignoredWcaMatches.current = { personId: person.id, wcaMatches: res.serverError.data.wcaMatches };
      }
      changeErrorMessages([getActionError(res)]);
    } else {
      ignoredWcaMatches.current = undefined;
      setPersons(persons.map((p) => (p.id === person.id ? res.data! : p)));
      changeSuccessMessage(`Successfully approved ${person.name} (ID: ${person.id})`);
    }
  };

  const updateCompetitors = (person: (typeof persons)[number], { isNew }: { isNew: boolean }) => {
    if (isNew) {
      setPersons([person, ...persons]);
    } else {
      setPersons(persons.map((p) => (p.id === person.id ? person : p)));
      setMode("view");
    }
  };

  return (
    <>
      <ToastMessages className="mx-2" />

      {mode === "view" ? (
        <Button
          onClick={onAddCompetitor}
          disabled={isDeleting || isApproving}
          className="btn-success btn-sm mx-2"
          style={{ width: "fit-content" }}
        >
          Create person profile
        </Button>
      ) : (
        <PersonForm
          personUnderEdit={personUnderEdit}
          creator={creator}
          regions={regions}
          onSubmit={updateCompetitors}
          onCancel={mode !== "add-once" ? cancel : undefined}
          wcaIdInputHidden={spaceType !== "speedcubing"}
        />
      )}

      {mode !== "add-once" && (
        <>
          <div className="px-2">
            <FiltersContainer className="mt-4 mb-3">
              <FormTextInput
                title="Search"
                value={search}
                setValue={setSearch}
                tooltip="Search by name, localized name, ID, or by the name or username of the creator."
                oneLine
              />
              <FormSelect
                title="Status"
                options={approvedFilterOptions}
                selected={approvedFilter}
                setSelected={setApprovedFilter as any}
                oneLine
                style={{ maxWidth: "15rem" }}
              />
            </FiltersContainer>

            <p className="mb-2">
              Number of competitors:&nbsp;<b>{filteredPersons.length}</b>
            </p>
          </div>

          <div ref={parentRef as any} className="table-responsive mt-3 overflow-y-auto" style={{ height: "600px" }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <table className="table-hover table text-nowrap">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Localized Name</th>
                    {spaceType === "speedcubing" && <th scope="col">WCA ID</th>}
                    <th scope="col">Country</th>
                    <th scope="col">Created by</th>
                    <th scope="col">Approved</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rowVirtualizer.getVirtualItems().map((virtualItem, index) => {
                    if (filteredPersons.length === 0) return undefined;
                    const person = filteredPersons[virtualItem.index];
                    const personCreator = creators.find((c) => c.userId === person.createdBy) ?? null;

                    return (
                      <tr
                        key={virtualItem.key as React.Key}
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start - index * virtualItem.size}px)`,
                        }}
                      >
                        <td>{person.id}</td>
                        <td>
                          <Competitor person={person} regions={regions} noFlag />
                        </td>
                        <td>{person.localizedName}</td>
                        {spaceType === "speedcubing" && <td>{person.wcaId}</td>}
                        <td>
                          <Region regionCode={person.regionCode} regions={regions} shorten />
                        </td>
                        <td>
                          <CreatorDetails
                            creator={personCreator}
                            regions={regions}
                            createdExternally={!!(person as SelectPerson).createdExternally}
                            isCurrentUser={(person as SelectPerson).createdBy === user?.id}
                            small
                          />
                        </td>
                        <td>
                          <ActiveInactiveIcon isActive={person.approved} />
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {canApprovePersons && !person.approved && (
                              <Button
                                id={`approve_person_${person.id}_button`}
                                onClick={() => approveCompetitor(person)}
                                disabled={buttonsDisabled}
                                loadingId={loadingId}
                                className="btn-xs btn-success"
                                title="Approve"
                                ariaLabel="Approve"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </Button>
                            )}
                            {(canApprovePersons || (person.createdBy === user?.id && !person.approved)) && (
                              <Button
                                onClick={() => onEditCompetitor(person)}
                                disabled={buttonsDisabled}
                                className="btn-xs"
                                title="Edit"
                                ariaLabel="Edit"
                              >
                                <FontAwesomeIcon icon={faPencil} />
                              </Button>
                            )}
                            {(canApprovePersons || (person.createdBy === user?.id && !person.approved)) && (
                              <Button
                                id={`delete_person_${person.id}_button`}
                                onClick={() => deleteCompetitor(person)}
                                disabled={buttonsDisabled}
                                loadingId={loadingId}
                                className="btn-xs btn-danger"
                                title="Delete"
                                ariaLabel="Delete"
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
          </div>
        </>
      )}
    </>
  );
}

export default ManageCompetitorsScreen;
