'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import FormTextInput from './FormTextInput';
import { IPerson } from '@sh/interfaces';

const MAX_MATCHES = 8;

const FormPersonInputs = ({
  title,
  personNames,
  setPersonNames,
  persons,
  setPersons,
  infiniteInputs = false,
  nextFocusTargetId,
  checkCustomErrors,
  setErrorMessages,
  setSuccessMessage,
}: {
  title: string;
  personNames: string[];
  setPersonNames: (val: string[]) => void;
  persons: IPerson[];
  setPersons: (val: IPerson[]) => void;
  infiniteInputs?: boolean;
  nextFocusTargetId?: string;
  checkCustomErrors?: (newSelectedPerson: IPerson) => boolean;
  setErrorMessages: (val: string[]) => void;
  setSuccessMessage?: (val: string) => void;
}) => {
  // The null element represents the option "add new person"
  const [matchedPersons, setMatchedPersons] = useState<IPerson[]>([null]);
  const [personSelection, setPersonSelection] = useState(0);
  const [focusedInput, setFocusedInput] = useState<number>(null);

  const queryMatchedPersons = async (value: string) => {
    if (value.trim()) {
      const { payload, errors } = await myFetch.get(`/persons?searchParam=${value}`);

      setMatchedPersons([null]);

      if (errors) {
        setErrorMessages(errors);
      } else if (payload.length > 0) {
        const newMatchedPersons = payload.slice(0, MAX_MATCHES);

        if (newMatchedPersons.length < MAX_MATCHES) newMatchedPersons.push(null);

        setMatchedPersons(newMatchedPersons);

        // Update current person selection
        if (newMatchedPersons.length < personSelection) setPersonSelection(0);
      }
    } else {
      if (matchedPersons.length > 1) setMatchedPersons([null]);
    }
  };

  const changeFocusedInput = (index: number | null, inputValue?: string) => {
    setFocusedInput(index);

    if (inputValue) queryMatchedPersons(inputValue);
  };

  // Returns true if an input was added
  const addEmptyInput = (newPersonNames: string[], newPersons: IPerson[]): boolean => {
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

    personsUpdated = addEmptyInput(newPersonNames, newPersons);

    setPersonNames(newPersonNames);
    if (personsUpdated) setPersons(newPersons);
    setErrorMessages([]);
    if (setSuccessMessage) setSuccessMessage('');

    queryMatchedPersons(value);
  };

  const focusNext = (newPersons: IPerson[], index: number) => {
    setFocusedInput(null);
    setMatchedPersons([null]);
    setPersonSelection(0);
    setErrorMessages([]);

    // Focus on the first attempt input, if all names have been entered, or the next competitor input,
    // if all names haven't been entered and the last competitor input is not currently focused
    if (!newPersons.includes(null)) {
      if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
    } else if (index + 1 < persons.length) {
      document.getElementById(`${title}_${index + 2}`)?.focus();
    }
  };

  const onPersonKeyDown = async (index: number, e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (matchedPersons[personSelection] === null) {
        window.location.href = '/mod/person';
        setFocusedInput(null);
      }
      // 1, because there is always the "add new competitor" option at the end
      else if (matchedPersons.length === 1) {
        setErrorMessages(['Person not found']);
      } else {
        const newSelectedPerson = matchedPersons[personSelection];
        const newPersonNames = personNames.map((el, i) => (i !== index ? el : newSelectedPerson.name));
        const samePersonIndex = persons.findIndex((el) => el?.personId === newSelectedPerson.personId);

        if (samePersonIndex >= 0) {
          if (samePersonIndex !== index) {
            setErrorMessages(['That competitor has already been selected']);
          } else {
            focusNext(persons, index);
            setPersonNames(newPersonNames);
          }
        } else if (!checkCustomErrors || !checkCustomErrors(newSelectedPerson)) {
          const newPersons = persons.map((el, i) => (i !== index ? el : newSelectedPerson));
          setPersons(newPersons);
          setPersonNames(newPersonNames);
          addEmptyInput(newPersonNames, newPersons);
          focusNext(newPersons, index);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (personSelection < matchedPersons.length - 1) {
        setPersonSelection(personSelection + 1);
      }
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
    <>
      {personNames.map((personName: string, i: number) => (
        <div key={i}>
          <FormTextInput
            title={personNames.length > 1 ? `${title} ${i + 1}` : 'Competitor'}
            id={`${title}_${i + 1}`}
            value={personName}
            setValue={(val: string) => changePersonName(i, val)}
            onKeyDown={(e: any) => onPersonKeyDown(i, e)}
            onFocus={() => changeFocusedInput(i, personName)}
            onBlur={() => changeFocusedInput(null)}
          />
          {i === focusedInput && personName.trim() && (
            <ul className="position-absolute list-group" style={{ zIndex: 10 }}>
              {matchedPersons.map((person: IPerson, index) =>
                person !== null ? (
                  <li
                    key={person.personId}
                    className={'list-group-item' + (index === personSelection ? ' active' : '')}
                    aria-current={index === personSelection}
                  >
                    {person.name}
                    {person.localizedName ? ` (${person.localizedName})` : ''}
                  </li>
                ) : (
                  <li
                    key={-1}
                    className={'list-group-item' + (index === personSelection ? ' active' : '')}
                    aria-current={index === personSelection}
                  >
                    (add new competitor)
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      ))}
    </>
  );
};

export default FormPersonInputs;