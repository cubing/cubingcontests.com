"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPencil, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useMyFetch } from "~/helpers/customHooks.ts";
import { IFePerson, ListPageMode } from "~/shared_helpers/types.ts";
import { getUserInfo } from "~/helpers/utilityFunctions.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { UserInfo } from "~/helpers/types.ts";
import { MultiChoiceOption } from "~/helpers/types.ts";
import Button from "~/app/components/UI/Button.tsx";
import Country from "~/app/components/Country.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import Competitor from "~/app/components/Competitor.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import PersonForm from "./PersonForm.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { getSimplifiedString } from "~/shared_helpers/sharedFunctions.ts";

const userInfo: UserInfo = getUserInfo();

const CreatePersonPage = () => {
  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const { changeSuccessMessage, loadingId, resetMessagesAndLoadingId } = useContext(MainContext);
  const parentRef = useRef<Element>(null);
  const [mode, setMode] = useState<ListPageMode | "add-once">(
    searchParams.get("redirect") ? "add-once" : "view",
  );
  const [persons, setPersons] = useState<IFePerson[]>([]);
  const [personUnderEdit, setPersonUnderEdit] = useState<IFePerson>();
  const [approvedFilter, setApprovedFilter] = useState<"approved" | "unapproved" | "">("");
  const [search, setSearch] = useState("");

  const filteredPersons = useMemo(() => {
    const simplifiedSearch = getSimplifiedString(search);

    return persons.filter((p: IFePerson) => {
      const passesNameFilter = getSimplifiedString(p.name).includes(simplifiedSearch) || // search by name
        (p.localizedName &&
          getSimplifiedString(p.localizedName).includes(simplifiedSearch)); // search by localized name
      const passesApprovedFilter = approvedFilter === "" ||
        (approvedFilter === "approved" && !p.unapproved) ||
        (approvedFilter === "unapproved" && p.unapproved);
      return passesNameFilter && passesApprovedFilter;
    });
  }, [persons, approvedFilter, search]);

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

  useEffect(() => {
    myFetch.get("/persons/mod", { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setPersons(payload);
    });
  }, []);

  const cancel = () => {
    setMode("view");
    resetMessagesAndLoadingId();
  };

  const onAddCompetitor = () => {
    setMode("add");
    setPersonUnderEdit(undefined);
    resetMessagesAndLoadingId();
  };

  const onEditCompetitor = (person: IFePerson) => {
    resetMessagesAndLoadingId();
    setMode("edit");
    setPersonUnderEdit(person);
    window.scrollTo(0, 0);
  };

  const deleteCompetitor = async (person: IFePerson) => {
    const { errors } = await myFetch.delete(`/persons/${(person as any)._id}`, {
      loadingId: `delete_person_${person.personId}_button`,
    });

    if (!errors) {
      setPersons(persons.filter((p: IFePerson) => (p as any)._id !== (person as any)._id));
      changeSuccessMessage(`Successfully deleted ${person.name} (CC ID: ${person.personId})`);
    }
  };

  const approveCompetitor = async (person: IFePerson) => {
    const { payload, errors } = await myFetch.patch(
      `/persons/${(person as any)._id}/approve`,
      { loadingId: `approve_person_${person.personId}_button` },
    );

    if (!errors) {
      setPersons(
        persons.map((p: IFePerson) => (p.personId === person.personId ? { ...payload, creator: p.creator } : p)),
      );
      changeSuccessMessage(`Successfully approved ${person.name} (CC ID: ${person.personId})`);
    }
  };

  const updateCompetitors = (person: IFePerson, isNew = false) => {
    if (isNew) {
      setPersons([person, ...persons]);
    } else {
      setPersons(
        persons.map((p: IFePerson) => (p.personId === person.personId ? { ...person, creator: p.creator } : p)),
      );
      setMode("view");
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-center">Competitors</h2>
      <ToastMessages />

      {mode === "view"
        ? (
          <Button onClick={onAddCompetitor} className="btn-success btn-sm ms-3" style={{ width: "fit-content" }}>
            Add competitor
          </Button>
        )
        : (
          <PersonForm
            personUnderEdit={personUnderEdit}
            onSubmit={updateCompetitors}
            onCancel={mode !== "add-once" ? cancel : undefined}
          />
        )}

      {mode !== "add-once" && (
        <>
          {/* Same styling as the filters on the manage users page */}
          <div className="d-flex flex-wrap align-items-center column-gap-3 mt-4 px-3">
            <FormTextInput
              title="Search"
              value={search}
              setValue={setSearch}
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
          </div>

          <p className="mb-2 px-3">
            Number of competitors:&nbsp;<b>{filteredPersons.length}</b>
          </p>

          <div ref={parentRef as any} className="mt-3 table-responsive overflow-y-auto" style={{ height: "600px" }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <table className="table table-hover text-nowrap">
                <thead>
                  <tr>
                    <th scope="col">CC ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Localized Name</th>
                    <th scope="col">WCA ID</th>
                    <th scope="col">Country</th>
                    {userInfo?.isAdmin && <th scope="col">Created by</th>}
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
                          {userInfo?.isAdmin && (
                            <td>
                              <CreatorDetails creator={person.creator} small loggedInUser={userInfo} />
                            </td>
                          )}
                          <td>
                            <FontAwesomeIcon
                              icon={person.unapproved ? faXmark : faCheck}
                              className={person.unapproved ? "text-danger" : ""}
                              style={{ height: "1.3rem" }}
                            />
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {userInfo?.isAdmin && person.unapproved && (
                                <Button
                                  id={`approve_person_${person.personId}_button`}
                                  onClick={() => approveCompetitor(person)}
                                  loadingId={loadingId}
                                  disabled={mode !== "view"}
                                  className="btn-xs btn-success"
                                  ariaLabel="Approve"
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                </Button>
                              )}
                              {(userInfo?.isAdmin || person.unapproved) && (
                                <Button
                                  onClick={() => onEditCompetitor(person)}
                                  disabled={mode !== "view"}
                                  className="btn-xs"
                                  ariaLabel="Edit"
                                >
                                  <FontAwesomeIcon icon={faPencil} />
                                </Button>
                              )}
                              {userInfo?.isAdmin && person.unapproved && (
                                <Button
                                  id={`delete_person_${person.personId}_button`}
                                  onClick={() => deleteCompetitor(person)}
                                  loadingId={loadingId}
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

export default CreatePersonPage;
