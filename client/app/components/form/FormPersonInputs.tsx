'use client';

import { useContext, useState } from 'react';
import { useLimitRequests, useMyFetch } from '~/helpers/customHooks';
import Loading from '@c/UI/Loading';
import FormTextInput from './FormTextInput';
import Competitor from '@c/Competitor';
import { IWcaPersonDto, IPerson } from '@sh/types';
import C from '@sh/constants';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { MainContext } from '~/helpers/contexts';

const userInfo: IUserInfo = getUserInfo();
const MAX_MATCHES = 6;
const personInputTooltip =
  "Enter the competitor's name if they are already on Cubing Contests. If not, enter their full WCA ID to add them.";

const FormPersonInputs = ({
  title,
  personNames,
  setPersonNames,
  persons,
  setPersons,
  infiniteInputs,
  nextFocusTargetId,
  disabled,
  addNewPersonFromNewTab,
  checkCustomErrors,
  redirectToOnAddPerson = '',
  noGrid,
}: {
  title: string;
  personNames: string[];
  setPersonNames: (val: string[]) => void;
  persons: IPerson[];
  setPersons: (val: IPerson[]) => void;
  infiniteInputs?: boolean;
  nextFocusTargetId?: string;
  disabled?: boolean;
  addNewPersonFromNewTab?: boolean;
  checkCustomErrors?: (newSelectedPerson: IPerson) => boolean;
  redirectToOnAddPerson?: string;
  noGrid?: boolean;
}) => {
  const myFetch = useMyFetch();
  const [limitMatchedPersonsRequests, isLoadingMatchedPersons] = useLimitRequests();
  const { resetMessagesAndLoadingId } = useContext(MainContext);

  // The null element represents the option "add new person" and is only an option given to an admin/moderator
  const defaultMatchedPersons: IPerson[] = userInfo.isMod ? [null] : [];

  const [matchedPersons, setMatchedPersons] = useState<IPerson[]>(defaultMatchedPersons);
  const [personSelection, setPersonSelection] = useState(0);
  const [focusedInput, setFocusedInput] = useState<number>(null);

  const queryMatchedPersons = (value: string) => {
    setMatchedPersons(defaultMatchedPersons);
    setPersonSelection(0);

    value = value.trim();

    if (value) {
      limitMatchedPersonsRequests(async () => {
        if (!C.wcaIdRegexLoose.test(value)) {
          const { payload, errors } = await myFetch.get(`/persons?name=${value}`);

          if (!errors && payload.length > 0) {
            const newMatchedPersons = [...payload.slice(0, MAX_MATCHES), ...defaultMatchedPersons];
            setMatchedPersons(newMatchedPersons);
            if (newMatchedPersons.length < personSelection) setPersonSelection(0);
          }
        } else {
          const { payload, errors } = await myFetch.get<IWcaPersonDto>(`/persons/${value}`, {
            authorize: true,
          });

          if (!errors) setMatchedPersons([payload.person]);
        }
      });
    }
  };

  // This is called first on focus leave for the previous input and then on focus for the new input
  const changeFocusedInput = (inputIndex: number | null, inputValue = '') => {
    setFocusedInput(inputIndex);
    setPersonSelection(0);
    queryMatchedPersons(inputValue);
  };

  // Returns true if an input was added
  const addEmptyInputIfRequired = (newPersonNames: string[], newPersons: IPerson[]): boolean => {
    // Add new empty input if there isn't an empty one left
    if (infiniteInputs && !newPersons.some((el) => el === null)) {
      newPersonNames.push('');
      newPersons.push(null);
      return true;
    }

    return false;
  };

  const changePersonName = (index: number, value: string) => {
    resetMessagesAndLoadingId();

    if (value) setFocusedInput(index);
    else setFocusedInput(null);

    // Update person name and reset the person object for that organizer
    const newPersonNames = personNames.map((el, i) => (i === index ? value : el));
    // This is done so that setPersons is only called if one of the persons actually had to be reset to null
    let personsUpdated = false;
    const newPersons: IPerson[] = persons.map((el, i) => {
      if (i === index) {
        if (persons[i] !== null) personsUpdated = true;
        return null;
      }
      return el;
    });

    personsUpdated = addEmptyInputIfRequired(newPersonNames, newPersons) || personsUpdated;

    setPersonNames(newPersonNames);
    if (personsUpdated) setPersons(newPersons);
    queryMatchedPersons(value);
  };

  const focusNext = (newPersons: IPerson[]) => {
    resetMessagesAndLoadingId();
    setFocusedInput(null);
    setMatchedPersons(defaultMatchedPersons);
    setPersonSelection(0);

    // Focus on the first attempt input, if all names have been entered, or the next person input,
    // if all names haven't been entered and the last person input is not currently focused
    if (!newPersons.includes(null)) {
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    } else {
      const emptyInputIndex = newPersons.findIndex((el) => el === null);
      document.getElementById(`${title}_${emptyInputIndex + 1}`)?.focus();
    }
  };

  const selectCompetitor = async (inputIndex: number, selectionIndex: number) => {
    if (matchedPersons[selectionIndex] === null) {
      // Only mods are allowed to open the add new competitor page
      if (userInfo.isMod) {
        setFocusedInput(null);

        if (addNewPersonFromNewTab) {
          open('/mod/competitors', '_blank');
        } else {
          if (!redirectToOnAddPerson) window.location.href = '/mod/competitors';
          else window.location.replace(`/mod/competitors?redirect=${redirectToOnAddPerson}`);
        }
      }
    } else {
      const newSelectedPerson = matchedPersons[selectionIndex];

      if (!checkCustomErrors || !checkCustomErrors(newSelectedPerson)) {
        const newPersons = persons.map((el, i) => (i !== inputIndex ? el : newSelectedPerson));
        const newPersonNames = personNames.map((el, i) => (i !== inputIndex ? el : newSelectedPerson.name));
        setPersons(newPersons);
        setPersonNames(newPersonNames);
        addEmptyInputIfRequired(newPersonNames, newPersons);
        // Queue focus next until the next tick, because otherwise the input immediately loses focus when clicking
        setTimeout(() => focusNext(newPersons), 0);
      }
    }
  };

  const onPersonKeyDown = async (inputIndex: number, e: any) => {
    if (e.key === 'Enter') {
      // Make sure the focused input is not empty
      if (personNames[inputIndex]) {
        selectCompetitor(inputIndex, personSelection);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (personSelection + 1 <= matchedPersons.length - defaultMatchedPersons.length) {
        setPersonSelection(personSelection + 1);
      } else {
        setPersonSelection(0);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (personSelection - 1 >= 0) setPersonSelection(personSelection - 1);
      else setPersonSelection(matchedPersons.length - defaultMatchedPersons.length);
    }
    // Disallow entering certain characters
    else if (/[()_/\\[\]]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="row">
      {personNames.map((personName: string, inputIndex: number) => (
        <div key={inputIndex} className={personNames.length > 1 && !noGrid ? 'col-md-6' : ''}>
          <FormTextInput
            id={`${title}_${inputIndex + 1}`}
            title={personNames.length > 1 ? `${title} ${inputIndex + 1}` : title}
            tooltip={inputIndex === 0 ? personInputTooltip : undefined}
            value={personName}
            setValue={(val: string) => changePersonName(inputIndex, val)}
            onKeyDown={(e: any) => onPersonKeyDown(inputIndex, e)}
            onFocus={() => changeFocusedInput(inputIndex, personName)}
            onBlur={() => changeFocusedInput(null)}
            disabled={disabled}
          />
          {inputIndex === focusedInput && personName && (
            <ul className="position-absolute list-group" style={{ zIndex: 10 }}>
              {isLoadingMatchedPersons ? (
                <li className="list-group-item">
                  <div style={{ width: '200px' }}>
                    <Loading small />
                  </div>
                </li>
              ) : matchedPersons.length > 0 ? (
                matchedPersons.map((person: IPerson, matchIndex) => (
                  <li
                    key={matchIndex}
                    className={'list-group-item' + (matchIndex === personSelection ? ' active' : '')}
                    style={{ cursor: 'pointer' }}
                    aria-current={matchIndex === personSelection}
                    onMouseEnter={() => setPersonSelection(matchIndex)}
                    onMouseDown={() => selectCompetitor(inputIndex, matchIndex)}
                  >
                    {person !== null ? <Competitor person={person} showLocalizedName noLink /> : '(add new person)'}
                  </li>
                ))
              ) : (
                '(competitor not found)'
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormPersonInputs;
