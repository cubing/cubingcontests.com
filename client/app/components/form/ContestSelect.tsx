"use client";

import debounce from "lodash/debounce";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useContext, useState } from "react";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Region from "~/app/components/Region.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import type { ContestResponse } from "~/server/db/schema/contests.ts";
import { getContestsByNameSF } from "~/server/server-functions/contest-server-functions.ts";
import FormTextInput from "./FormTextInput.tsx";

type Props = {
  contestName: string;
  setContestName: (val: string) => void;
  setContest: (val: ContestResponse | null) => void;
  tooltip?: string;
  oneLine?: boolean;
  disabled?: boolean;
};

function ContestSelect({ contestName, setContestName, setContest, tooltip, oneLine = false, disabled = false }: Props) {
  const { changeErrorMessages, resetMessages } = useContext(MainContext);

  const { executeAsync: getContestsByName, isPending } = useAction(getContestsByNameSF);
  const [matchedContests, setMatchedContests] = useState<ContestResponse[]>([]);
  const [matchSelection, setMatchSelection] = useState(0);
  const [isFocusedInput, setIsFocusedInput] = useState(false);

  const getMatchedContests = useCallback(
    debounce(async (value: string) => {
      resetMessages();

      const res = await getContestsByName({ search: value });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else if (res.data!.length > 0) {
        setMatchedContests(res.data!);
      }
    }, C.fetchDebounceTimeout),
    [matchSelection],
  );

  const queryMatchedContests = (value: string) => {
    setMatchedContests([]);
    setMatchSelection(0);

    value = value.trim();
    if (value) getMatchedContests(value);
    else getMatchedContests.cancel();
  };

  const changeIsFocusedInput = (newIsFocusedInput: boolean) => {
    setIsFocusedInput(newIsFocusedInput);
    setMatchSelection(0);
    queryMatchedContests(contestName);
  };

  const changeContestName = (value: string) => {
    setIsFocusedInput(value !== "");
    setContestName(value);
    setContest(null);
    queryMatchedContests(value);
  };

  const selectContest = (selectionIndex: number) => {
    if (!isPending) {
      const selectedContest = matchedContests[selectionIndex];

      setContest(selectedContest);
      setContestName(selectedContest.shortName);
      setIsFocusedInput(false);
    }
  };

  const onContestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (contestName) selectContest(matchSelection);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (matchSelection + 1 <= matchedContests.length - 1) setMatchSelection(matchSelection + 1);
      else setMatchSelection(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (matchSelection - 1 >= 0) setMatchSelection(matchSelection - 1);
      else setMatchSelection(matchedContests.length - 1);
    }
  };

  return (
    <div className="position-relative">
      <FormTextInput
        title="Competition"
        tooltip={tooltip}
        value={contestName}
        setValue={changeContestName}
        onKeyDown={onContestKeyDown}
        onFocus={() => changeIsFocusedInput(true)}
        onBlur={() => changeIsFocusedInput(false)}
        disabled={disabled}
        oneLine={oneLine}
      />

      {isFocusedInput && contestName && (
        <ul className="position-absolute end-0 mt-3 list-group" style={{ zIndex: 10 }}>
          {isPending ? (
            <li className="list-group-item">
              <div style={{ minWidth: "200px" }}>
                <Loading small />
              </div>
            </li>
          ) : matchedContests.length > 0 ? (
            matchedContests.map((matchedContest, matchIndex) => (
              <li
                key={matchedContest.competitionId}
                className={`list-group-item ${matchIndex === matchSelection ? "active" : ""}`}
                style={{ cursor: "pointer" }}
                aria-current={matchIndex === matchSelection}
                onMouseEnter={() => setMatchSelection(matchIndex)}
                onMouseDown={() => selectContest(matchIndex)}
              >
                <div className="d-flex gap-2 align-items-center">
                  <ContestTypeBadge type={matchedContest.type} display="icon" />
                  <span>{matchedContest.shortName}</span>
                  <Region regionCode={matchedContest.regionCode} noText />
                </div>
              </li>
            ))
          ) : (
            <li className="list-group-item">(competition not found)</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default ContestSelect;
