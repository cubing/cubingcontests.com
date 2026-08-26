"use client";

import debounce from "lodash/debounce";
import { useQueryState } from "nuqs";
import { useCallback, useContext, useState } from "react";
import useSWR from "swr";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Person from "~/app/components/Person.tsx";
import Region from "~/app/components/Region.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { SpaceType } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import type { SelectPerson } from "~/server/db/schema/persons.ts";
import { getPersonProfilesSF } from "~/server/server-functions/person-server-functions.ts";

type Props = {
  slug: string;
};

function PersonsSearch({ slug }: Props) {
  const { changeErrorMessages, resetMessages } = useContext(MainContext);

  const [search, setSearch] = useQueryState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: spaceType }: { data: SpaceType } = useSWR(SwrKey.SpaceType, { suspense: true });
  const {
    data: persons,
    isValidating,
    mutate,
  } = useSWR<SelectPerson[]>(search ? ["persons-search", search] : null, async () => {
    const res = await getPersonProfilesSF({ slug, search: search ?? "", orderBy: "name" });
    if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
    return res.data ?? [];
  });

  const setSearchDebounced = useCallback(debounce(setSearch, C.fetchDebounceTimeout), []);

  const onSearchChange = (value: string) => {
    resetMessages();
    setSearchInput(value);
    if (value) setSearchDebounced(value);
    else mutate([], { revalidate: false });
  };

  return (
    <div className="px-2">
      <FormTextInput
        title="Search"
        value={searchInput}
        setValue={onSearchChange}
        tooltip={spaceType === "speedcubing" ? "Search by name or WCA ID" : undefined}
        className="tw:max-w-100"
      />

      {search && (
        <>
          <p className="mt-3 mb-2">
            Number of persons:&nbsp;<b>{isValidating ? "…" : (persons?.length ?? 0)}</b>
          </p>

          {isValidating ? (
            <Loading />
          ) : (
            <div className="table-responsive">
              <table className="table-hover table text-nowrap">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Country</th>
                    {spaceType === "speedcubing" && <th scope="col">WCA ID</th>}
                  </tr>
                </thead>
                <tbody>
                  {persons?.map((person) => (
                    <tr key={person.id}>
                      <td>{person.id}</td>
                      <td>
                        <Person person={person} noFlag />
                      </td>
                      <td>
                        <Region regionCode={person.regionCode} shorten />
                      </td>
                      {spaceType === "speedcubing" && (
                        <td>
                          {person.wcaId && (
                            <a
                              href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`}
                              target="_blank"
                              rel="noopener"
                            >
                              {person.wcaId}
                            </a>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PersonsSearch;
