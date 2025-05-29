"use client";

import { useContext, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPencil, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { authClient } from "~/helpers/authClient.ts";
import { Creator, ListPageMode, ModPersonsData } from "~/helpers/types.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
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

type Props = {
  modPersonsData: ModPersonsData;
};

const ManageCompetitorsScreen = ({ modPersonsData: { persons: initialPersons, users } }: Props) => {
  const searchParams = useSearchParams();
  const { changeSuccessMessage, resetMessages } = useContext(MainContext);
  const { data: session } = authClient.useSession();
  const parentRef = useRef<Element>(null);
  const [mode, setMode] = useState<ListPageMode | "add-once">(searchParams.get("redirect") ? "add-once" : "view");
  const [persons, setPersons] = useState<(PersonResponse | SelectPerson)[]>(initialPersons);
  const [personUnderEdit, setPersonUnderEdit] = useState<PersonResponse | SelectPerson>();
  const [approvedFilter, setApprovedFilter] = useState<"approved" | "unapproved" | "">("");
  const [search, setSearch] = useState("");

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
    setMode("add");
    setPersonUnderEdit(undefined);
    resetMessages();
  };

  const onEditCompetitor = (person: PersonResponse) => {
    resetMessages();
    setMode("edit");
    setPersonUnderEdit(person);
    window.scrollTo(0, 0);
  };

  const deleteCompetitor = async (person: PersonResponse) => {
    // const res = await myFetch.delete(`/persons/${(person as any)._id}`, {
    //   loadingId: `delete_person_${person.personId}_button`,
    // });

    // if (res.success) {
    //   setPersons(
    //     persons.filter((p: PersonResponse) => (p as any)._id !== (person as any)._id),
    //   );
    //   changeSuccessMessage(
    //     `Successfully deleted ${person.name} (CC ID: ${person.personId})`,
    //   );
    // }
  };

  const approveCompetitor = async (person: PersonResponse) => {
    // const res = await myFetch.patch(
    //   `/persons/${(person as any)._id}/approve`,
    //   { loadingId: `approve_person_${person.personId}_button` },
    // );

    // if (res.success) {
    //   // CODE SMELL!!! it shouldn't be necessary to keep the old creator values, they should just be set
    //   // properly in the returned array. Same issue below in updateCompetitors.
    //   setPersons(
    //     persons.map((
    //       p: PersonResponse,
    //     ) => (p.personId === person.personId ? { ...res.data, creator: p.creator } : p)),
    //   );
    //   changeSuccessMessage(
    //     `Successfully approved ${person.name} (CC ID: ${person.personId})`,
    //   );
    // }
  };

  const updateCompetitors = (person: PersonResponse, isNew = false) => {
    //   if (isNew) {
    //     setPersons([person, ...persons]);
    //   } else {
    //     setPersons(
    //       persons.map((
    //         p: PersonResponse,
    //       ) => (p.personId === person.personId ? { ...person, creator: p.creator } : p)),
    //     );
    //     setMode("view");
    //   }
  };

  return (
    <section>
      <h2 className="mb-4 text-center">Competitors</h2>
      <ToastMessages />

      {mode === "view"
        ? (
          <Button onClick={onAddCompetitor} className="btn-success btn-sm mx-2" style={{ width: "fit-content" }}>
            Add competitor
          </Button>
        )
        : (
          <PersonForm
            personUnderEdit={personUnderEdit}
            creator={personUnderEdit
              ? users?.find((u) => u.id === (personUnderEdit as SelectPerson).createdBy)
              : undefined}
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
                                user={users.find((c) => c.id === (person as SelectPerson).createdBy)}
                                person={person}
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
                                  // loadingId={loadingId}
                                  disabled={mode !== "view"}
                                  className="btn-xs btn-success"
                                  ariaLabel="Approve"
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                </Button>
                              )}
                              {(isAdmin || !person.approved) && (
                                <Button
                                  onClick={() => onEditCompetitor(person)}
                                  disabled={mode !== "view"}
                                  className="btn-xs"
                                  ariaLabel="Edit"
                                >
                                  <FontAwesomeIcon icon={faPencil} />
                                </Button>
                              )}
                              {(isAdmin || !person.approved) && (
                                <Button
                                  id={`delete_person_${person.personId}_button`}
                                  onClick={() => deleteCompetitor(person)}
                                  // loadingId={loadingId}
                                  disabled={mode !== "view"}
                                  className="btn-xs btn-danger"
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
};

export default ManageCompetitorsScreen;
