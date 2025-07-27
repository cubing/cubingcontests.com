"use client";

import { useContext, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPencil, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { authClient } from "~/helpers/authClient.ts";
import { Creator, ListPageMode } from "~/helpers/types.ts";
import { MainContext } from "~/helpers/contexts.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import Button from "~/app/components/UI/Button.tsx";
import Country from "~/app/components/Country.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import Competitor from "~/app/components/Competitor.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import PersonForm from "./PersonForm.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { getSimplifiedString } from "~/helpers/sharedFunctions.ts";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import { PersonResponse, SelectPerson } from "~/server/db/schema/persons.ts";
import { useAction } from "next-safe-action/hooks";
import { approvePersonSF, deletePersonSF } from "~/server/serverFunctions/personServerFunctions.ts";
import { getActionError } from "~/helpers/utilityFunctions.ts";

type Props = {
  persons: (SelectPerson | PersonResponse)[];
  users?: Creator[]; // only returned to admins
};

function ManageCompetitorsScreen({ persons: initPersons, users }: Props) {
  const searchParams = useSearchParams();
  const { changeSuccessMessage, changeErrorMessages, resetMessages } = useContext(MainContext);
  const { data: session } = authClient.useSession();

  const { executeAsync: deletePerson, isPending: isDeleting } = useAction(deletePersonSF);
  const { executeAsync: approvePerson, isPending: isApproving } = useAction(approvePersonSF);
  const [mode, setMode] = useState<ListPageMode | "add-once">(searchParams.get("redirect") ? "add-once" : "view");
  // Mods only see public columns (PersonResponse[]), but admins can see all columns (SelectPerson[])
  const [persons, setPersons] = useState<PersonResponse[] | SelectPerson[]>(initPersons);
  const [personUnderEdit, setPersonUnderEdit] = useState<PersonResponse | SelectPerson>();
  const [approvedFilter, setApprovedFilter] = useState<"approved" | "unapproved" | "">("");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const parentRef = useRef<Element>(null);
  // Only used for admins. Is used to confirm approval of person with exact name and country match with a WCA person.
  const ignoredWcaMatches = useRef<{ personId: number; wcaMatches: string[] }>(undefined);
  const creator = useMemo(
    () => personUnderEdit ? users?.find((u) => u.id === (personUnderEdit as SelectPerson).createdBy) : undefined,
    [personUnderEdit, users],
  );
  const filteredPersons = useMemo(() => {
    const simplifiedSearch = getSimplifiedString(search);

    return persons.filter((p) => {
      const passesNameFilter = getSimplifiedString(p.name).includes(simplifiedSearch) || // search by name
        (p.localizedName && getSimplifiedString(p.localizedName).includes(simplifiedSearch)) || // search by localized name
        p.personId.toString() === simplifiedSearch || // search by person ID
        (users && users.find((c) => c.id === (p as SelectPerson).createdBy)?.username === simplifiedSearch); // search by creator username

      const passesApprovedFilter = approvedFilter === "" ||
        (approvedFilter === "approved" && p.approved) ||
        (approvedFilter === "unapproved" && !p.approved);

      return passesNameFilter && passesApprovedFilter;
    });
  }, [persons, approvedFilter, search]);

  const isAdmin = users !== undefined;
  const buttonsDisabled = mode !== "view" || isDeleting || isApproving;
  const approvedFilterOptions: MultiChoiceOption[] = [
    { label: "Any", value: "" },
    { label: "Approved", value: "approved" },
    { label: "Not approved", value: "unapproved" },
  ];

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

  const onEditCompetitor = (person: PersonResponse) => {
    ignoredWcaMatches.current = undefined;
    resetMessages();
    setMode("edit");
    setPersonUnderEdit(person);
    window.scrollTo(0, 0);
  };

  const deleteCompetitor = async (person: PersonResponse) => {
    ignoredWcaMatches.current = undefined;
    setLoadingId(`delete_person_${person.personId}_button`);
    const res = await deletePerson({ id: person.id });
    setLoadingId("");

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      setPersons(persons.filter((p) => p.id !== person.id));
      changeSuccessMessage(`Successfully deleted ${person.name} (CC ID: ${person.personId})`);
    }
  };

  const approveCompetitor = async (person: PersonResponse) => {
    if (ignoredWcaMatches.current && person.personId !== ignoredWcaMatches.current.personId) {
      ignoredWcaMatches.current = undefined;
    }

    setLoadingId(`approve_person_${person.personId}_button`);
    const res = await approvePerson({ id: person.id, ignoredWcaMatches: ignoredWcaMatches.current?.wcaMatches });
    setLoadingId("");

    if (res.serverError || res.validationErrors) {
      if (res.serverError?.data) {
        ignoredWcaMatches.current = { personId: person.personId, wcaMatches: res.serverError.data.wcaMatches };
      }
      changeErrorMessages([getActionError(res)]);
    } else {
      ignoredWcaMatches.current = undefined;
      setPersons(persons.map((p) => p.id === person.id ? res.data! : p));
      changeSuccessMessage(`Successfully approved ${person.name} (CC ID: ${person.personId})`);
    }
  };

  const updateCompetitors = (person: PersonResponse | SelectPerson, isNew = false) => {
    if (isNew) {
      setPersons([person, ...persons]);
    } else {
      setPersons(persons.map((p) => (p.personId === person.personId ? person : p)));
      setMode("view");
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-center">Competitors</h2>
      <ToastMessages />

      {mode === "view"
        ? (
          <Button
            onClick={onAddCompetitor}
            disabled={isDeleting || isApproving}
            className="btn-success btn-sm mx-2"
            style={{ width: "fit-content" }}
          >
            Add competitor
          </Button>
        )
        : (
          <PersonForm
            personUnderEdit={personUnderEdit}
            creator={creator}
            creatorPerson={creator ? persons.find((p) => p.personId === creator.personId) : undefined}
            onSubmit={updateCompetitors}
            onCancel={mode !== "add-once" ? cancel : undefined}
          />
        )}

      {mode !== "add-once" && (
        <>
          <FiltersContainer className="mt-4">
            <FormTextInput
              title="Search"
              value={search}
              setValue={setSearch}
              tooltip={"Search by name, localized name, or CC ID" +
                (isAdmin ? ". Admins can also search by the username of the creator." : "")}
              oneLine
            />
            <FormSelect
              title="Status"
              selected={approvedFilter}
              setSelected={setApprovedFilter}
              options={approvedFilterOptions}
              oneLine
              style={{ maxWidth: "15rem" }}
            />
          </FiltersContainer>

          <p className="mb-2 px-2">
            Number of competitors:&nbsp;<b>{filteredPersons.length}</b>
          </p>

          <div
            ref={parentRef as any}
            className="mt-3 table-responsive overflow-y-auto"
            style={{ height: "600px" }}
          >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <table className="table table-hover text-nowrap">
                <thead>
                  <tr>
                    <th scope="col">CC ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Localized Name</th>
                    <th scope="col">WCA ID</th>
                    <th scope="col">Country</th>
                    {isAdmin && <th scope="col">Created by</th>}
                    <th scope="col">Approved</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rowVirtualizer.getVirtualItems().map(
                    (virtualItem, index) => {
                      if (filteredPersons.length === 0) return;
                      const person = filteredPersons[virtualItem.index];
                      const personCreator = (person as SelectPerson).createdBy
                        ? users.find((u) => u.id === (person as SelectPerson).createdBy)
                        : undefined;

                      return (
                        <tr
                          key={virtualItem.key as React.Key}
                          style={{
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start - index * virtualItem.size}px)`,
                          }}
                        >
                          <td>{person.personId}</td>
                          <td>
                            <Competitor person={person} noFlag />
                          </td>
                          <td>{person.localizedName}</td>
                          <td>{person.wcaId}</td>
                          <td>
                            <Country countryIso2={person.countryIso2} shorten />
                          </td>
                          {users && (
                            <td>
                              <CreatorDetails
                                creator={personCreator}
                                person={personCreator?.personId
                                  ? persons.find((p) => p.personId === personCreator.personId)
                                  : undefined}
                                createdExternally={!!(person as SelectPerson).createdExternally}
                                isCurrentUser={(person as SelectPerson).createdBy === session?.user.id}
                                small
                              />
                            </td>
                          )}
                          <td>
                            <FontAwesomeIcon
                              icon={person.approved ? faCheck : faXmark}
                              className={person.approved ? "" : "text-danger"}
                              style={{ height: "1.3rem" }}
                            />
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {isAdmin && !person.approved && (
                                <Button
                                  id={`approve_person_${person.personId}_button`}
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
                              {(isAdmin || !person.approved) && (
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
                              {(isAdmin || !person.approved) && (
                                <Button
                                  id={`delete_person_${person.personId}_button`}
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
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ManageCompetitorsScreen;
