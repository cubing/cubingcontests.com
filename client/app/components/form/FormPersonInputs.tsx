'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import FormTextInput from './FormTextInput';
import { IPerson } from '~/shared_helpers/interfaces';

const MAX_MATCHES = 8;

const FormPersonInputs = ({
  label,
  personNames,
  setPersonNames,
  persons,
  setPersons,
  matchedPersons,
  setMatchedPersons,
  personSelection,
  setPersonSelection,
  selectPerson,
  setErrorMessages,
  setSuccessMessage,
  infiniteInputs = false,
}: {
  label: string;
  personNames: string[];
  setPersonNames: (value: string[]) => void;
  persons: IPerson[];
  setPersons: (value: IPerson[]) => void;
  // The null element represents the option "add new person"
  matchedPersons: IPerson[];
  setMatchedPersons: (value: IPerson[]) => void;
  personSelection: number;
  setPersonSelection: (value: number) => void;
  selectPerson: (newSelectedPerson: IPerson, index: number) => void;
  setErrorMessages: (value: string[]) => void;
  setSuccessMessage?: (value: string) => void;
  infiniteInputs?: boolean;
}) => {
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

  const changePersonName = (index: number, value: string) => {
    if (value) setFocusedInput(index);
    else setFocusedInput(null);

    // Update person name and reset the person object for that organizer
    const newPersonNames = personNames.map((el, i) => (i !== index ? el : value));
    const newPersons = persons.map((el, i) => (i !== index ? el : null));

    // Add new empty input if there isn't an empty one left
    if (infiniteInputs && !newPersons.some((el) => el === null)) {
      newPersonNames.push('');
      newPersons.push(null);
    }

    setPersonNames(newPersonNames);
    setPersons(newPersons);
    setErrorMessages([]);
    if (setSuccessMessage) setSuccessMessage('');

    queryMatchedPersons(value);
  };

  const onPersonKeyDown = async (index: number, e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (matchedPersons[personSelection] === null) {
        window.location.href = '/mod/person';
        setFocusedInput(null);
      } else {
        // 1, because there is always the "add new competitor" option at the end
        if (matchedPersons.length === 1) {
          setErrorMessages(['Person not found']);
        } else {
          selectPerson(matchedPersons[personSelection], index);
          setFocusedInput(null);
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
            title={`${label} ${i + 1}`}
            id={`${label}_${i + 1}`}
            value={personName}
            setValue={(val: string) => changePersonName(i, val)}
            onKeyDown={(e: any) => onPersonKeyDown(i, e)}
            onFocus={() => changeFocusedInput(i, personName)}
            onBlur={() => changeFocusedInput(null)}
          />
          {i === focusedInput && personName.trim() && (
            <ul className="position-absolute list-group">
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
