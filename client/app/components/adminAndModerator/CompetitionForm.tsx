'use client';

import './CompetitionForm.css';
import { useEffect, useMemo, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '../form/Form';
import FormTextInput from '../form/FormTextInput';
import FormCountrySelect from '../form/FormCountrySelect';
import FormEventSelect from '../form/FormEventSelect';
import FormRadio from '../form/FormRadio';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
import 'react-datepicker/dist/react-datepicker.css';
import { ICompetitionEvent, ICompetitionModData, IEvent, IPerson, IRound } from '@sh/interfaces';
import { CompetitionState, CompetitionType, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { selectPerson } from '~/helpers/utilityFunctions';
import { roundFormats } from '~/helpers/roundFormats';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import { roundTypes } from '~/helpers/roundTypes';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const competitionTypeOptions: MultiChoiceOption[] = [
  {
    label: 'Meetup',
    value: CompetitionType.Meetup,
  },
  {
    label: 'Competition',
    value: CompetitionType.Competition,
    disabled: true,
  },
];

const roundProceedOptions: MultiChoiceOption[] = [
  {
    label: 'Number',
    value: RoundProceed.Number,
  },
  {
    label: 'Percentage',
    value: RoundProceed.Percentage,
  },
];

const getDateOnly = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const coordToMicrodegrees = (value: string): number | null => {
  if (isNaN(Number(value))) return null;

  return parseInt(Number(value).toFixed(6).replace('.', ''));
};

const CompetitionForm = ({ events, compData }: { events: IEvent[]; compData?: ICompetitionModData }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(1);
  const [newEventId, setNewEventId] = useState('333');

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(CompetitionType.Meetup);
  const [city, setCity] = useState('');
  const [countryIso2, setCountryId] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [latitudeMicrodegrees, setLatitudeMicrodegrees] = useState('');
  const [longitudeMicrodegrees, setLongitudeMicrodegrees] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null); // competition-only
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState('');
  const [mainEventId, setMainEventId] = useState('333');
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);

  const remainingEvents = useMemo(
    () => events.filter((event) => !competitionEvents.some((ce) => ce.event.eventId === event.eventId)),
    [events, competitionEvents],
  );
  const isFinished = useMemo(() => compData?.competition.state >= CompetitionState.Finished, [compData]);
  const isNotCreated = useMemo(
    () => compData?.competition.state && compData.competition.state !== CompetitionState.Created,
    [compData],
  );

  useEffect(() => {
    if (compData) {
      setCompetitionId(compData.competition.competitionId);
      setName(compData.competition.name);
      setType(compData.competition.type);
      setCity(compData.competition.city);
      setCountryId(compData.competition.countryIso2);
      setVenue(compData.competition.venue);
      if (compData.competition.address) setAddress(compData.competition.address);
      setLatitudeMicrodegrees((compData.competition.latitudeMicrodegrees / 1000000).toFixed(6));
      setLongitudeMicrodegrees((compData.competition.longitudeMicrodegrees / 1000000).toFixed(6));
      // Convert the dates from string to Date
      setStartDate(new Date(compData.competition.startDate));
      if (compData.competition.endDate) setEndDate(new Date(compData.competition.endDate));
      if (compData.competition.organizers) {
        setOrganizerNames([...compData.competition.organizers.map((el) => el.name), '']);
        setOrganizers(compData.competition.organizers);
      }
      if (compData.competition.contact) setContact(compData.competition.contact);
      if (compData.competition.description) setDescription(compData.competition.description);
      if (compData.competition.competitorLimit) setCompetitorLimit(compData.competition.competitorLimit.toString());
      setMainEventId(compData.competition.mainEventId);
      setCompetitionEvents(compData.competition.events);
    }
  }, [compData]);

  useEffect(() => {
    document.getElementById('competition_name').focus();
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (errorMessages.find((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages]);

  useEffect(() => {
    if (organizerNames.length !== 1) {
      document.getElementById(`organizer_${organizerNames.length}`)?.focus();
    }
  }, [organizerNames.length]);

  useEffect(() => {
    console.log(competitionEvents);
  }, [competitionEvents]);

  const handleSubmit = async () => {
    const selectedOrganizers = organizers.filter((el) => el !== null);
    const correctStartDate = type !== CompetitionType.Meetup ? getDateOnly(startDate) : startDate;
    const correctEndDate = endDate ? getDateOnly(endDate) : undefined;

    const newComp = {
      ...compData?.competition,
      competitionId,
      name: name.trim(),
      type,
      city: city.trim(),
      countryIso2,
      venue: venue.trim(),
      address: address.trim() || undefined,
      latitudeMicrodegrees: coordToMicrodegrees(latitudeMicrodegrees) || undefined,
      longitudeMicrodegrees: coordToMicrodegrees(longitudeMicrodegrees) || undefined,
      startDate: correctStartDate,
      endDate: correctEndDate,
      organizers: selectedOrganizers.length > 0 ? selectedOrganizers : undefined,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit && !isNaN(parseInt(competitorLimit)) ? parseInt(competitorLimit) : undefined,
      mainEventId,
      // Set the competition ID for every round
      events: competitionEvents.map((compEvent) => ({
        ...compEvent,
        rounds: compEvent.rounds.map((round) => ({ ...round, competitionId })),
      })),
    };

    // Check for errors
    const tempErrors: string[] = [];

    if (selectedOrganizers.length < organizerNames.filter((el) => el !== '').length)
      tempErrors.push('Please enter all organizers');
    if (!newComp.competitionId) tempErrors.push('Please enter a competition ID');
    if (!newComp.name) tempErrors.push('Please enter a name');
    if (!newComp.city) tempErrors.push('Please enter a city');
    if (!newComp.venue) tempErrors.push('Please enter a venue');
    if (!newComp.latitudeMicrodegrees || !newComp.longitudeMicrodegrees)
      tempErrors.push('Please enter valid venue coordinates');
    if (newComp.events.length === 0) tempErrors.push('You must enter at least one event');
    else if (!competitionEvents.some((el) => el.event.eventId === mainEventId))
      tempErrors.push('The selected main event is not on the list of events');

    if (type === CompetitionType.Competition) {
      if (!newComp.address) tempErrors.push('Please enter the address');
      if (newComp.startDate > newComp.endDate) tempErrors.push('The start date must be before the end date');
      if (!newComp.organizers) tempErrors.push('Please enter at least one organizer');
      if (!newComp.contact) tempErrors.push('Please enter a contact email address');
      if (!newComp.competitorLimit) tempErrors.push('Please enter a valid competitor limit');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const { errors } = compData
        ? await myFetch.patch(`/competitions/${compData.competition.competitionId}`, newComp) // edit competition
        : await myFetch.post('/competitions', newComp); // create competition

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        window.location.href = '/admin';
      }
    }
  };

  const changeName = (value: string) => {
    // Update Competition ID accordingly, unless it deviates from the name
    if (competitionId === name.replace(/ /g, '')) {
      setCompetitionId(value.replace(/ /g, ''));
    }

    setName(value);
  };

  const changeType = (newType: CompetitionType) => {
    setType(newType);

    if (newType === CompetitionType.Meetup) {
      setEndDate(null);
    } else {
      setEndDate(new Date());
    }
  };

  const changeOrganizerName = (index: number, value: string) => {
    const newOrganizerNames = organizerNames.map((el, i) => (i !== index ? el : value));
    // Reset the person object for that organizer
    const newOrganizers = organizers.map((el, i) => (i !== index ? el : null));

    // Add new empty input if there isn't an empty one left
    if (!newOrganizers.some((el) => el === null)) {
      newOrganizerNames.push('');
      newOrganizers.push(null);
    }

    setOrganizerNames(newOrganizerNames);
    setOrganizers(newOrganizers);
  };

  const onSelectOrganizer = (index: number, e: any) => {
    selectPerson(e, setErrorMessages, (person: IPerson) => {
      // Set the found organizer's name
      const newOrganizerNames = organizerNames.map((el, i) => (i !== index ? el : person.name));

      if (organizers.some((el) => el?.personId === person.personId)) {
        setErrorMessages(['That organizer has already been selected']);
      } else {
        const newOrganizers = organizers.map((el, i) => (i !== index ? el : person));

        // Add new empty input if there isn't an empty one left
        if (!newOrganizerNames.some((el) => el.trim() === '')) {
          newOrganizerNames.push('');
          newOrganizers.push(null);
        }

        setOrganizers(newOrganizers);
        setErrorMessages([]);
      }

      setOrganizerNames(newOrganizerNames);
    });
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
          },
    );
    setCompetitionEvents(newCompetitionEvents);
  };

  const changeRoundProceed = (eventIndex: number, roundIndex: number, type: RoundProceed, value?: string) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : { ...round, proceed: { type, value: value ? Number(value) : round.proceed.value } },
            ),
          },
    );
    setCompetitionEvents(newCompetitionEvents);
  };

  const getNewRound = (eventId: string): IRound => {
    return {
      competitionId: 'temp', // this gets replaced for all rounds on submit
      eventId: eventId,
      date: startDate,
      compNotPublished: true,
      roundTypeId: RoundType.Final,
      format: events.find((el) => el.eventId === eventId).defaultRoundFormat,
      results: [],
    };
  };

  const addRound = (eventId: string) => {
    const updatedCompEvent = competitionEvents.find((el) => el.event.eventId === eventId);

    // Update the currently semi-final round
    if (updatedCompEvent.rounds.length > 2) {
      const semiRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 2];
      semiRound.roundTypeId = Object.values(RoundType)[updatedCompEvent.rounds.length - 2];
    }

    // Update the currently last round
    const lastRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 1];
    lastRound.proceed = {
      type: RoundProceed.Percentage,
      value: 50,
    };
    lastRound.roundTypeId = updatedCompEvent.rounds.length > 1 ? RoundType.Semi : RoundType.First;

    // Add new round
    updatedCompEvent.rounds.push(getNewRound(eventId));
    console.log(updatedCompEvent);

    setCompetitionEvents(competitionEvents.map((el) => (el.event.eventId === eventId ? updatedCompEvent : el)));
  };

  const removeEventRound = (eventId: string) => {
    const updatedCompEvent = competitionEvents.find((el) => el.event.eventId === eventId);
    updatedCompEvent.rounds = updatedCompEvent.rounds.slice(0, -1);

    // Update new final round
    const newLastRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 1];
    delete newLastRound.proceed;
    newLastRound.roundTypeId = RoundType.Final;

    // Update new semi final round
    if (updatedCompEvent.rounds.length > 2) {
      const newSemiRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 2];
      newSemiRound.roundTypeId = RoundType.Semi;
    }

    setCompetitionEvents(competitionEvents.map((el) => (el.event.eventId === eventId ? updatedCompEvent : el)));
  };

  const addCompetitionEvent = () => {
    setCompetitionEvents(
      [
        ...competitionEvents,
        {
          event: events.find((el) => el.eventId === newEventId),
          rounds: [getNewRound(newEventId)],
        },
      ].sort((a: ICompetitionEvent, b: ICompetitionEvent) => a.event.rank - b.event.rank),
    );

    if (remainingEvents.length > 1) {
      const newId = remainingEvents.find((event) => event.eventId !== newEventId)?.eventId;
      setNewEventId(newId);
    }
  };

  const removeCompetitionEvent = (eventId: string) => {
    setCompetitionEvents(competitionEvents.filter((el) => el.event.eventId !== eventId));
  };

  return (
    <Form buttonText={compData ? 'Edit' : 'Create'} errorMessages={errorMessages} handleSubmit={handleSubmit}>
      <ul className="mb-3 nav nav-tabs">
        <li className="me-2 nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === 1 ? ' active' : '')}
            onClick={() => setActiveTab(1)}
          >
            Details
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === 2 ? ' active' : '')}
            onClick={() => setActiveTab(2)}
          >
            Events
          </button>
        </li>
      </ul>

      {activeTab === 1 && (
        <>
          <FormTextInput
            id="competition_name"
            name="Competition name"
            value={name}
            setValue={changeName}
            disabled={isNotCreated}
          />
          <FormTextInput
            name="Competition ID"
            value={competitionId}
            setValue={setCompetitionId}
            disabled={!!compData}
          />
          <FormRadio
            title="Type"
            options={competitionTypeOptions}
            selected={type}
            setSelected={(val: any) => changeType(val)}
            disabled={!!compData}
          />
          <div className="row">
            <div className="col">
              <FormTextInput name="City" value={city} setValue={setCity} disabled={isNotCreated} />
            </div>
            <div className="col">
              <FormCountrySelect countryIso2={countryIso2} setCountryId={setCountryId} disabled={!!compData} />
            </div>
          </div>
          <FormTextInput name="Address" value={address} setValue={setAddress} disabled={isFinished} />
          <div className="row">
            <div className="col-6">
              <FormTextInput name="Venue" value={venue} setValue={setVenue} disabled={isFinished} />
            </div>
            <div className="col-3">
              <FormTextInput
                name="Latitude"
                value={latitudeMicrodegrees}
                setValue={setLatitudeMicrodegrees}
                disabled={isFinished}
              />
            </div>
            <div className="col-3">
              <FormTextInput
                name="Longitude"
                value={longitudeMicrodegrees}
                setValue={setLongitudeMicrodegrees}
                disabled={isFinished}
              />
            </div>
          </div>
          <div className="mb-3 row">
            <div className="col">
              <label htmlFor="start_date" className="form-label">
                {type === CompetitionType.Competition ? 'Start date' : 'Start date and time (UTC)'}
              </label>
              <DatePicker
                id="start_date"
                selected={startDate}
                showTimeSelect={type === CompetitionType.Meetup}
                locale="en-GB"
                timeFormat="p"
                dateFormat={type === CompetitionType.Meetup ? 'Pp' : 'P'}
                onChange={(date: Date) => setStartDate(date)}
                className="form-control"
                disabled={isNotCreated}
              />
            </div>
            {type === CompetitionType.Competition && (
              <div className="col">
                <label htmlFor="end_date" className="form-label">
                  End date
                </label>
                <DatePicker
                  id="end_date"
                  selected={endDate}
                  locale="en-GB"
                  dateFormat="P"
                  onChange={(date: Date) => setEndDate(date)}
                  className="form-control"
                  disabled={isNotCreated}
                />
              </div>
            )}
          </div>
          <h5>Organizers</h5>
          <div className="my-3 pt-3 px-4 border rounded bg-body-tertiary">
            {organizerNames.map((organizerName, i) => (
              <FormTextInput
                key={i}
                name={`Organizer ${i + 1}`}
                id={`organizer_${i + 1}`}
                value={organizerName}
                setValue={(val: string) => changeOrganizerName(i, val)}
                onKeyPress={(e: any) => onSelectOrganizer(i, e)}
              />
            ))}
          </div>
          <FormTextInput name="Contact" placeholder="john@example.com" value={contact} setValue={setContact} />
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={10}
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              className="form-control"
            />
          </div>
          <FormTextInput
            name="Competitor limit"
            value={competitorLimit}
            setValue={setCompetitorLimit}
            disabled={isNotCreated}
          />
        </>
      )}
      {activeTab === 2 && (
        <>
          <div className="my-4 row align-items-center">
            <div className="col-2">
              <button
                type="button"
                className="btn btn-success"
                onClick={addCompetitionEvent}
                disabled={competitionEvents.length === events.length || isFinished}
              >
                Add Event
              </button>
            </div>
            <div className="col-10">
              <FormEventSelect
                label=""
                noMargin
                events={remainingEvents}
                eventId={newEventId}
                setEventId={setNewEventId}
                disabled={isFinished}
              />
            </div>
          </div>
          {competitionEvents.map((compEvent, eventIndex) => (
            <div key={compEvent.event.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>{compEvent.event.name}</h4>
                <button
                  type="button"
                  className="ms-3 btn btn-danger btn-sm"
                  onClick={() => removeCompetitionEvent(compEvent.event.eventId)}
                  disabled={isFinished || compEvent.rounds.some((r) => r.results.length > 0)}
                >
                  Remove Event
                </button>
              </div>
              {compEvent.rounds.map((round, roundIndex) => (
                <div key={round.roundTypeId} className="mb-3 pt-2 px-4 border rounded bg-body-secondary">
                  <div className="mb-3 row">
                    <div className="col-4">
                      <h5 className="mt-2">{roundTypes[round.roundTypeId].label}</h5>
                    </div>
                    <div className="col-8">
                      <div className="fs-5">
                        <label htmlFor="round_format" className="form-label">
                          Round format
                        </label>
                        <select
                          id="round_format"
                          className="form-select"
                          value={round.format}
                          onChange={(e) => changeRoundFormat(eventIndex, roundIndex, e.target.value as RoundFormat)}
                          disabled={isFinished || round.results.length > 0}
                        >
                          {Object.values(roundFormats).map((rf: any) => (
                            <option key={rf.id} value={rf.id}>
                              {rf.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {round.roundTypeId !== RoundType.Final && (
                    <>
                      <FormRadio
                        title="Proceed to next round"
                        options={roundProceedOptions}
                        selected={round.proceed.type}
                        setSelected={(val: any) => changeRoundProceed(eventIndex, roundIndex, val as RoundProceed)}
                        disabled={isFinished || round.results.length > 0}
                      />
                      <FormTextInput
                        id="round_proceed_value"
                        value={round.proceed.value.toString()}
                        setValue={(val: string) => changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)}
                        disabled={isFinished || round.results.length > 0}
                      />
                    </>
                  )}
                </div>
              ))}
              <div className="d-flex gap-3">
                {compEvent.rounds.length < 10 && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => addRound(compEvent.event.eventId)}
                    disabled={isFinished}
                  >
                    Add Round
                  </button>
                )}
                {compEvent.rounds.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeEventRound(compEvent.event.eventId)}
                    disabled={
                      isFinished || compEvent.rounds.find((r) => r.roundTypeId === RoundType.Final).results.length > 0
                    }
                  >
                    Remove Round
                  </button>
                )}
              </div>
            </div>
          ))}
          <FormEventSelect
            label="Main Event"
            events={events}
            eventId={mainEventId}
            setEventId={setMainEventId}
            disabled={isNotCreated}
          />
        </>
      )}
    </Form>
  );
};

export default CompetitionForm;
