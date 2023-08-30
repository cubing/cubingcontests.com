'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import FormTextInput from './FormTextInput';
import { IPerson } from '@sh/interfaces';
import Loading from '../Loading';
import { limitRequests } from '~/helpers/utilityFunctions';

const MAX_MATCHES = 6;

const FormPersonInputs = ({
  title,
  personNames,
  setPersonNames,
  persons,
  setPersons,
  infiniteInputs = false,
  nextFocusTargetId,
  disabled = false,
  addNewPersonFromNewTab = false,
  checkCustomErrors,
  setErrorMessages,
  setSuccessMessage,
  redirectToOnAddPerson = '',
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
  setErrorMessages: (val: string[]) => void;
  setSuccessMessage?: (val: string) => void;
  redirectToOnAddPerson?: string;
}) => {
  // The null element represents the option "add new person"
  const [matchedPersons, setMatchedPersons] = useState<IPerson[]>([null]);
  const [personSelection, setPersonSelection] = useState(0);
  const [focusedInput, setFocusedInput] = useState<number>(null);
  const [fetchMatchedPersonsTimer, setFetchMatchedPersonsTimer] = useState<NodeJS.Timeout>(null);

  const queryMatchedPersons = (value: string) => {
    setMatchedPersons([null]);
    setPersonSelection(0);

    if (value.trim()) {
      limitRequests(fetchMatchedPersonsTimer, setFetchMatchedPersonsTimer, async () => {
        const { payload, errors } = await myFetch.get(`/persons?searchParam=${value}`);

        if (errors) {
          setErrorMessages(errors);
        } else if (payload.length > 0) {
          // The last item is for "add new person"
          const newMatchedPersons = [...payload.slice(0, MAX_MATCHES), null];

          setMatchedPersons(newMatchedPersons);

          // Update current person selection
          if (newMatchedPersons.length < personSelection) setPersonSelection(0);
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
    setErrorMessages([]);
    if (setSuccessMessage) setSuccessMessage('');

    queryMatchedPersons(value);
  };

  const focusNext = (newPersons: IPerson[]) => {
    setFocusedInput(null);
    setMatchedPersons([null]);
    setPersonSelection(0);
    setErrorMessages([]);

    // Focus on the first attempt input, if all names have been entered, or the next person input,
    // if all names haven't been entered and the last person input is not currently focused
    if (!newPersons.includes(null)) {
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    } else {
      const emptyInputIndex = newPersons.findIndex((el) => el === null);
      document.getElementById(`${title}_${emptyInputIndex + 1}`)?.focus();
    }
  };

  const selectCompetitor = (inputIndex: number) => {
    if (matchedPersons[personSelection] === null) {
      setFocusedInput(null);

      if (addNewPersonFromNewTab) {
        open('/mod/person', '_blank');
      } else {
        if (!redirectToOnAddPerson) window.location.href = '/mod/person';
        else window.location.replace(`/mod/person?redirect=${redirectToOnAddPerson}`);
      }
    } else {
      const newSelectedPerson = matchedPersons[personSelection];
      const newPersonNames = personNames.map((el, i) => (i !== inputIndex ? el : newSelectedPerson.name));

      if (!checkCustomErrors || !checkCustomErrors(newSelectedPerson)) {
        const newPersons = persons.map((el, i) => (i !== inputIndex ? el : newSelectedPerson));
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
        selectCompetitor(inputIndex);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      setPersonSelection(Math.min(personSelection + 1, matchedPersons.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      setPersonSelection(Math.max(personSelection - 1, 0));
    }
    // Disallow entering numbers and certain characters
    else if (/[0-9()_/\\[\]]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={'row' + (personNames.length > 1 ? ' row-cols-2' : '')}>
      {personNames.map((personName: string, inputIndex: number) => (
        <div key={inputIndex} className="col">
          <FormTextInput
            title={personNames.length > 1 ? `${title} ${inputIndex + 1}` : title}
            id={`${title}_${inputIndex + 1}`}
            value={personName}
            setValue={(val: string) => changePersonName(inputIndex, val)}
            onKeyDown={(e: any) => onPersonKeyDown(inputIndex, e)}
            onFocus={() => changeFocusedInput(inputIndex, personName)}
            onBlur={() => changeFocusedInput(null)}
            disabled={disabled}
          />
          {inputIndex === focusedInput && personName && (
            <ul className="position-absolute list-group" style={{ zIndex: 10 }}>
              {fetchMatchedPersonsTimer !== null && (
                <li className="list-group-item">
                  <Loading small />
                </li>
              )}
              {matchedPersons.map((person: IPerson, matchIndex) => (
                <li
                  key={matchIndex}
                  className={'list-group-item' + (matchIndex === personSelection ? ' active' : '')}
                  style={{ cursor: 'pointer' }}
                  aria-current={matchIndex === personSelection}
                  onMouseEnter={() => setPersonSelection(matchIndex)}
                  onMouseDown={() => selectCompetitor(inputIndex)}
                >
                  {person !== null ? (
                    <>
                      {person.name}
                      {person.localizedName ? ` (${person.localizedName})` : ''}
                    </>
                  ) : (
                    '(add new person)'
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormPersonInputs;
