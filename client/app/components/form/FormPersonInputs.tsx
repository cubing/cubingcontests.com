'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import FormTextInput from './FormTextInput';
import { IPerson } from '~/shared_helpers/interfaces';

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
    if (value) {
      const { payload, errors } = await myFetch.get(`/persons?searchParam=${value}`);

      setMatchedPersons([]);

      if (errors) {
        setErrorMessages(errors);
      } else if (payload.length > 0) {
        const newMatchedPersons = payload.slice(0, 10);

        setMatchedPersons(newMatchedPersons);

        // Update current person selection
        if (newMatchedPersons.length < personSelection) setPersonSelection(0);
      }
    } else {
      setMatchedPersons([]);
    }
  };

  const changeFocusedInput = (index: number, inputValue?: string) => {
    setFocusedInput(index);

    if (!inputValue) setMatchedPersons([]);
    else queryMatchedPersons(inputValue);
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

      if (matchedPersons.length === 0) {
        setErrorMessages(['Person not found']);
      } else {
        selectPerson(matchedPersons[personSelection], index);
        setFocusedInput(null);
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
          {i === focusedInput && (
            <ul className="position-absolute list-group">
              {matchedPersons.map((person: IPerson, index) => (
                <li
                  key={person.personId}
                  className={'list-group-item' + (index === personSelection ? ' active' : '')}
                  aria-current={index === personSelection}
                >
                  {person.name}
                  {person.localizedName ? ` (${person.localizedName})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
};

export default FormPersonInputs;
