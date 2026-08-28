"use client";

import debounce from "lodash/debounce";
import { useQueryState } from "nuqs";
import { useCallback, useContext, useState } from "react";
import useSWR from "swr";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Person from "~/app/components/Person.tsx";
import Region from "~/app/components/Region.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import PaginationControls from "~/app/components/UI/PaginationControls.tsx";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { usePageNumber } from "~/helpers/hooks.ts";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { SpaceType } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import { getPersonProfilesSF } from "~/server/server-functions/person-server-functions.ts";

type Props = {
  slug: string;
};

function PersonsSearch({ slug }: Props) {
  const { changeErrorMessages, resetMessages } = useContext(MainContext);

  const [page, setPage] = usePageNumber();
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [searchInput, setSearchInput] = useState(search ?? "");

  const { data: spaceType }: { data: SpaceType } = useSWR(SwrKey.SpaceType, { suspense: true });
  const { data: personsData, isValidating } = useSWR(
    ["persons-search", search, page],
    async () => {
      const res = await getPersonProfilesSF({ slug, search: search ?? "", orderBy: "name", page });
      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      return res.data ?? { entries: [], totalEntries: 0 };
    },
    { keepPreviousData: true },
  );

  const setSearchDebounced = useCallback(debounce(setSearch, C.fetchDebounceTimeout), []);

  const onSearchChange = (value: string) => {
    resetMessages();
    setSearchInput(value);
    setPage(1);
    setSearchDebounced(value);
  };

  return (
    <>
      <FormTextInput
        title="Search"
        value={searchInput}
        setValue={onSearchChange}
        tooltip={spaceType === "speedcubing" ? "Search by name or WCA ID" : undefined}
        className="mb-3 tw:max-w-100 px-2"
      />

      {!personsData || isValidating ? (
        <Loading />
      ) : (
        <>
          {/* There's another one at the bottom */}
          <PaginationControls totalEntries={personsData.totalEntries} disabled={isValidating} className="px-2" />

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
                {personsData.entries.map((person) => (
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

          <PaginationControls totalEntries={personsData.totalEntries} disabled={isValidating} className="px-2" />
        </>
      )}
    </>
  );
}

export default PersonsSearch;
