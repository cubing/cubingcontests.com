'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '../Loading';
import FormTextInput from './FormTextInput';
import Competitor from '@c/Competitor';
import { IPerson } from '@sh/interfaces';
import C from '@sh/constants';
import { getUserInfo, limitRequests } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';

const userInfo: IUserInfo = getUserInfo();
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
  noGrid = false,
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
  noGrid?: boolean;
}) => {
  // The null element represents the option "add new person" and is only an option given to an admin/moderator
  const defaultMatchedPersons: IPerson[] = userInfo.isMod ? [null] : [];

  const [matchedPersons, setMatchedPersons] = useState<IPerson[]>(defaultMatchedPersons);
  const [personSelection, setPersonSelection] = useState(0);
  const [focusedInput, setFocusedInput] = useState<number>(null);
  const [fetchMatchedPersonsTimer, setFetchMatchedPersonsTimer] = useState<NodeJS.Timeout>(null);

  const queryMatchedPersons = (value: string) => {
    setMatchedPersons(defaultMatchedPersons);
    setPersonSelection(0);

    value = value.trim();

    if (value) {
      limitRequests(fetchMatchedPersonsTimer, setFetchMatchedPersonsTimer, async () => {
        if (!C.wcaIdRegexLoose.test(value)) {
          const { payload, errors } = await myFetch.get(`/persons?searchParam=${value}`);

          if (errors) {
            setErrorMessages(errors);
          } else if (payload.length > 0) {
            const newMatchedPersons = [...payload.slice(0, MAX_MATCHES), ...defaultMatchedPersons];

            setMatchedPersons(newMatchedPersons);

            // Update current person selection
            if (newMatchedPersons.length < personSelection) setPersonSelection(0);
          }
        } else {
          value = value.toUpperCase();
          const { payload, errors } = await myFetch.get(`${C.wcaApiBase}/persons/${value}.json`);

          if (errors) {
            setErrorMessages(errors);
          } else {
            // personId and createdBy are set later
            setMatchedPersons([
              { personId: 0, name: payload.name, countryIso2: payload.country, wcaId: value, createdBy: '' },
            ]);
          }
        }
      });
    }
  };

  // This is called first on focus leave for the previous input and then on focus for the new input
  const changeFocusedInput = (inputIndex: number | null, inputValue = ``) => {
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
    setMatchedPersons(defaultMatchedPersons);
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

  const selectCompetitor = async (inputIndex: number) => {
    if (matchedPersons[personSelection] === null) {
      // Only mods are allowed to open the add new competitor page
      if (userInfo.isMod) {
        setFocusedInput(null);

        if (addNewPersonFromNewTab) {
          open(`/mod/person`, `_blank`);
        } else {
          if (!redirectToOnAddPerson) window.location.href = `/mod/person`;
          else window.location.replace(`/mod/person?redirect=${redirectToOnAddPerson}`);
        }
      }
    } else {
      let newSelectedPerson = matchedPersons[personSelection];
      const newPersonNames = personNames.map((el, i) => (i !== inputIndex ? el : newSelectedPerson.name));

      // If selection was done using the WCA ID, personId would be 0 here
      if (newSelectedPerson.personId === 0) {
        const { payload, errors } = await myFetch.post(`/persons/create-or-get`, newSelectedPerson);

        if (errors) {
          setErrorMessages(errors);
          return;
        } else {
          newSelectedPerson = payload;
        }
      }

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
    if (e.key === `Enter`) {
      // Make sure the focused input is not empty
      if (personNames[inputIndex]) {
        selectCompetitor(inputIndex);
      }
    } else if (e.key === `ArrowDown`) {
      e.preventDefault();

      if (personSelection + 1 <= matchedPersons.length - defaultMatchedPersons.length) {
        setPersonSelection(personSelection + 1);
      } else {
        setPersonSelection(0);
      }
    } else if (e.key === `ArrowUp`) {
      e.preventDefault();

      if (personSelection - 1 >= 0) {
        setPersonSelection(personSelection - 1);
      } else {
        setPersonSelection(matchedPersons.length - defaultMatchedPersons.length);
      }
    }
    // Disallow entering certain characters
    else if (/[()_/\\[\]]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="row">
      {personNames.map((personName: string, inputIndex: number) => (
        <div key={inputIndex} className={personNames.length > 1 && !noGrid ? `col-md-6` : ``}>
          <FormTextInput
            title={(personNames.length > 1 ? `${title} ${inputIndex + 1}` : title) + ' (WCA ID or name)'}
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
              {fetchMatchedPersonsTimer !== null ? (
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
                    onMouseDown={() => selectCompetitor(inputIndex)}
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
