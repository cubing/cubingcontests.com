'use client';

import './CompetitionForm.css';
import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import { startOfToday, addHours, differenceInDays } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import myFetch from '~/helpers/myFetch';
import Form from '../form/Form';
import FormTextInput from '../form/FormTextInput';
import FormCountrySelect from '../form/FormCountrySelect';
import FormEventSelect from '../form/FormEventSelect';
import FormRadio from '../form/FormRadio';
import FormSelect from '../form/FormSelect';
import FormPersonInputs from '../form/FormPersonInputs';
import Tabs from '../Tabs';
import Schedule from '../Schedule';
import { ICompetition, ICompetitionEvent, IEvent, IPerson, IRoom, IRound } from '@sh/interfaces';
import { Color, CompetitionState, CompetitionType, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { getDateOnly } from '@sh/sharedFunctions';
import {
  colorOptions,
  competitionTypeOptions,
  roundFormatOptions,
  roundProceedOptions,
} from '~/helpers/multipleChoiceOptions';
import { roundTypes } from '~/helpers/roundTypes';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const coordToMicrodegrees = (value: string): number | null => {
  if (isNaN(Number(value))) return null;

  return parseInt(Number(value).toFixed(6).replace('.', ''));
};

const CompetitionForm = ({ events, competition }: { events: IEvent[]; competition?: ICompetition }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(1);
  const [matchedPersons, setMatchedPersons] = useState<IPerson[]>([null]);
  const [personSelection, setPersonSelection] = useState(0);

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(CompetitionType.Meetup);
  const [city, setCity] = useState('');
  const [countryIso2, setCountryId] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date()); // competition-only
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState('');

  // Event stuff
  const [newEventId, setNewEventId] = useState('333');
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);
  const [mainEventId, setMainEventId] = useState('333');

  // Schedule stuff
  const [venueTimezone, setVenueTimezone] = useState('');
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomColor, setRoomColor] = useState<Color>(Color.White);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState('');
  // These are in UTC, but get displayed in the local timezone of the venue
  const [activityStartTime, setActivityStartTime] = useState<Date>();
  const [activityEndTime, setActivityEndTime] = useState<Date>();

  const tabs = useMemo(
    () => (type === CompetitionType.Competition ? ['Details', 'Events', 'Schedule'] : ['Details', 'Events']),
    [type],
  );
  const filteredEvents = useMemo(() => {
    const newFiltEv = events.filter((ev) => !ev.removed && (type === CompetitionType.Meetup || !ev.meetupOnly));

    // Reset new event ID and main event ID if new filtered events don't include them
    if (newFiltEv.length > 0) {
      if (!newFiltEv.some((ev) => ev.eventId === newEventId)) setNewEventId(newFiltEv[0]?.eventId);
      if (!newFiltEv.some((ev) => ev.eventId === mainEventId)) setMainEventId(newFiltEv[0]?.eventId);
    }

    return newFiltEv;
  }, [events, type]);
  const remainingEvents = useMemo(
    () => filteredEvents.filter((ev) => !competitionEvents.some((ce) => ce.event.eventId === ev.eventId)),
    [filteredEvents, competitionEvents],
  );
  const isFinished = useMemo(() => competition?.state >= CompetitionState.Finished, [competition]);
  const isNotCreated = useMemo(
    () => competition?.state && competition.state !== CompetitionState.Created,
    [competition],
  );
  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: room.name,
        value: room.id,
      })),
    [rooms.length],
  );
  const isValidRoom = useMemo(() => roomName.trim() !== '', [roomName]);
  const isValidActivity = useMemo(
    () => activityCode && roomOptions.some((el) => el.value === selectedRoom),
    [activityCode, roomOptions, selectedRoom],
  );

  //////////////////////////////////////////////////////////////////////////////
  // Use effect
  //////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (competition) {
      setCompetitionId(competition.competitionId);
      setName(competition.name);
      setType(competition.type);
      setCity(competition.city);
      setCountryId(competition.countryIso2);
      setVenue(competition.venue);
      if (competition.address) setAddress(competition.address);
      setLatitude((competition.latitudeMicrodegrees / 1000000).toFixed(6));
      setLongitude((competition.longitudeMicrodegrees / 1000000).toFixed(6));
      // Convert the dates from string to Date
      setStartDate(new Date(competition.startDate));
      if (competition.organizers) {
        setOrganizerNames([...competition.organizers.map((el) => el.name), '']);
        setOrganizers([...competition.organizers, null]);
      }
      if (competition.contact) setContact(competition.contact);
      if (competition.description) setDescription(competition.description);
      if (competition.competitorLimit) setCompetitorLimit(competition.competitorLimit.toString());
      setCompetitionEvents(competition.events);
      setNewEventId(
        events.find((ev) => !competition.events.some((ce) => ce.event.eventId === ev.eventId))?.eventId || '333',
      );
      setMainEventId(competition.mainEventId);

      // Competition-only stuff
      if (competition.type === CompetitionType.Competition) {
        setEndDate(new Date(competition.endDate));

        const venue = competition.compDetails.schedule.venues[0];
        setRooms(venue.rooms);
        setVenueTimezone(venue.timezone);
      }
    }
  }, [competition]);

  useEffect(() => {
    document.getElementById('competition_name').focus();
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (errorMessages.find((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages]);

  useEffect(() => {
    if (organizers.length !== 1 && organizers.filter((el) => el === null).length === 1) {
      document.getElementById(`Organizer_${organizerNames.length}`)?.focus();
    }
  }, [organizers]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    const selectedOrganizers = organizers.filter((el) => el !== null);
    const latitudeMicrodegrees = coordToMicrodegrees(latitude);
    const longitudeMicrodegrees = coordToMicrodegrees(longitude);
    const startDateOnly = getDateOnly(startDate);
    const endDateOnly = getDateOnly(endDate);

    const newComp: ICompetition = {
      ...competition,
      competitionId,
      name: name.trim(),
      type,
      city: city.trim(),
      countryIso2,
      venue: venue.trim(),
      address: address.trim() || undefined,
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate: type !== CompetitionType.Meetup ? startDateOnly : startDate,
      endDate: type !== CompetitionType.Meetup ? endDateOnly : undefined,
      organizers: selectedOrganizers.length > 0 ? selectedOrganizers : undefined,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit && !isNaN(parseInt(competitorLimit)) ? parseInt(competitorLimit) : undefined,
      mainEventId,
      // Set the competition ID and date for every round
      events: competitionEvents.map((compEvent) => ({
        ...compEvent,
        rounds: compEvent.rounds.map((round) => ({
          ...round,
          competitionId: competition?.competitionId || competitionId,
          date:
            type === CompetitionType.Meetup
              ? startDateOnly
              : getDateOnly(
                utcToZonedTime(
                  // Finds the start time of the round based on the schedule
                  (() => {
                    for (const room of rooms) {
                      const activity = room.activities.find((a) => a.activityCode === round.roundId);
                      if (activity) return activity.startTime;
                    }
                  })(),
                  venueTimezone,
                ),
              ),
        })),
      })),
      compDetails:
        type === CompetitionType.Competition
          ? {
              schedule: {
                competitionId,
                startDate: startDateOnly,
                numberOfDays: differenceInDays(endDateOnly, startDateOnly) + 1,
                venues: [
                  {
                    id: 1,
                    name: venue,
                    latitudeMicrodegrees,
                    longitudeMicrodegrees,
                    countryIso2,
                    timezone: venueTimezone,
                    // Only send the rooms that have at least one activity
                    rooms: rooms.filter((el) => el.activities.length > 0),
                  },
                ],
              },
            }
          : undefined,
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

    const meetupOnlyCompEvent = competitionEvents.find((el) => el.event.meetupOnly);
    if (type !== CompetitionType.Meetup && meetupOnlyCompEvent)
      tempErrors.push(`The event ${meetupOnlyCompEvent.event.name} is only allowed for meetups`);

    if (type === CompetitionType.Competition) {
      if (!newComp.address) tempErrors.push('Please enter an address');
      if (!newComp.organizers) tempErrors.push('Please enter at least one organizer');
      if (!newComp.contact) tempErrors.push('Please enter a contact email address');
      if (!newComp.competitorLimit) tempErrors.push('Please enter a valid competitor limit');
      if (newComp.startDate > newComp.endDate) tempErrors.push('The start date must be before the end date');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const { errors } = competition
        ? await myFetch.patch(`/competitions/${competition.competitionId}`, newComp) // edit competition
        : await myFetch.post('/competitions', newComp); // create competition

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        window.location.href = '/admin';
      }
    }
  };

  const changeActiveTab = async (newTab: number) => {
    if (newTab === 3) {
      const { errors, payload } = await myFetch.get(
        `/competitions/timezone?latitude=${latitude}&longitude=${longitude}`,
        { authorize: true },
      );

      if (errors) {
        setErrorMessages(errors);
      } else {
        setVenueTimezone(payload.timezone);
        const today = startOfToday();
        setActivityStartTime(zonedTimeToUtc(addHours(today, 12), payload.timezone));
        setActivityEndTime(zonedTimeToUtc(addHours(today, 13), payload.timezone));
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  };

  const changeName = (value: string) => {
    // Update Competition ID accordingly, unless it deviates from the name
    if (competitionId === name.replaceAll(' ', '')) {
      setCompetitionId(value.replaceAll(' ', ''));
    }

    setName(value);
  };

  const selectOrganizer = (newSelectedPerson: IPerson, index: number) => {
    // Set the found organizer's name
    const newOrganizerNames = organizerNames.map((el, i) => (i !== index ? el : newSelectedPerson.name));

    if (organizers.some((el) => el?.personId === newSelectedPerson.personId)) {
      setErrorMessages(['That competitor has already been selected']);
    }
    // If no errors, set the competitor object
    else {
      const newOrganizers = organizers.map((el, i) => (i !== index ? el : newSelectedPerson));

      // Add new empty input if there isn't an empty one left
      if (!newOrganizers.some((el) => el === null)) {
        newOrganizerNames.push('');
        newOrganizers.push(null);
      }

      setOrganizers(newOrganizers);
      setErrorMessages([]);
      setMatchedPersons([null]);
      setPersonSelection(0);
    }

    setOrganizerNames(newOrganizerNames);
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

  const getNewRound = (eventId: string, roundNumber: number): IRound => {
    return {
      roundId: `${eventId}-r${roundNumber}`,
      competitionId: 'temp', // this gets replaced for all rounds on submit
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
    updatedCompEvent.rounds.push(getNewRound(eventId, updatedCompEvent.rounds.length + 1));

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
          rounds: [getNewRound(newEventId, 1)],
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

  const addRoom = () => {
    setRoomName('');
    setRooms([
      ...rooms,
      {
        id: rooms.length + 1,
        name: roomName.trim(),
        color: roomColor,
        activities: [],
      },
    ]);
  };

  const changeActivityStartTime = (newTime: Date) => {
    setActivityStartTime(zonedTimeToUtc(newTime, venueTimezone));
  };

  const changeActivityEndTime = (newTime: Date) => {
    const zonedStartTime = utcToZonedTime(activityStartTime, venueTimezone);
    const newActivityEndTime = zonedTimeToUtc(
      new Date(
        zonedStartTime.getUTCFullYear(),
        zonedStartTime.getUTCMonth(),
        zonedStartTime.getUTCDate(),
        newTime.getUTCHours(),
        newTime.getUTCMinutes(),
      ),
      venueTimezone,
    );

    setActivityEndTime(newActivityEndTime);
  };

  const addActivity = () => {
    const newRooms = rooms.map((room) =>
      room.id !== selectedRoom
        ? room
        : {
            ...room,
            activities: [
              ...room.activities,
              {
                id: room.activities.length + 1,
                activityCode,
                startTime: activityStartTime,
                endTime: activityEndTime,
              },
            ],
          },
    );

    setRooms(newRooms);
    setActivityCode('');
  };

  return (
    <>
      <Form
        buttonText={competition ? 'Edit Competition' : 'Create Competition'}
        errorMessages={errorMessages}
        handleSubmit={handleSubmit}
        hideButton={activeTab !== 1}
      >
        <Tabs titles={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

        {activeTab === 1 && (
          <>
            <FormTextInput
              id="competition_name"
              title="Competition name"
              value={name}
              setValue={changeName}
              disabled={isNotCreated}
            />
            <FormTextInput
              title="Competition ID"
              value={competitionId}
              setValue={setCompetitionId}
              disabled={!!competition}
            />
            <FormRadio
              title="Type"
              options={competitionTypeOptions}
              selected={type}
              setSelected={(val: any) => setType(val)}
              disabled={!!competition}
            />
            <div className="row">
              <div className="col">
                <FormTextInput title="City" value={city} setValue={setCity} disabled={isNotCreated} />
              </div>
              <div className="col">
                <FormCountrySelect countryIso2={countryIso2} setCountryId={setCountryId} disabled={!!competition} />
              </div>
            </div>
            <FormTextInput title="Address" value={address} setValue={setAddress} disabled={isFinished} />
            <div className="row">
              <div className="col-6">
                <FormTextInput title="Venue" value={venue} setValue={setVenue} disabled={isFinished} />
              </div>
              <div className="col-3">
                <FormTextInput title="Latitude" value={latitude} setValue={setLatitude} disabled={isFinished} />
              </div>
              <div className="col-3">
                <FormTextInput title="Longitude" value={longitude} setValue={setLongitude} disabled={isFinished} />
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
                  timeFormat="p"
                  dateFormat={type === CompetitionType.Meetup ? 'Pp' : 'P'}
                  locale="en-GB"
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
                    dateFormat="P"
                    locale="en-GB"
                    onChange={(date: Date) => setEndDate(date)}
                    className="form-control"
                    disabled={isNotCreated}
                  />
                </div>
              )}
            </div>
            <h5>Organizers</h5>
            <div className="my-3 pt-3 px-4 border rounded bg-body-tertiary">
              <FormPersonInputs
                label="Organizer"
                personNames={organizerNames}
                setPersonNames={setOrganizerNames}
                persons={organizers}
                setPersons={setOrganizers}
                matchedPersons={matchedPersons}
                setMatchedPersons={setMatchedPersons}
                personSelection={personSelection}
                setPersonSelection={setPersonSelection}
                selectPerson={selectOrganizer}
                setErrorMessages={setErrorMessages}
                infiniteInputs
              />
            </div>
            <FormTextInput title="Contact" placeholder="john@example.com" value={contact} setValue={setContact} />
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
              title="Competitor limit"
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
                  disabled={competitionEvents.length === filteredEvents.length || isFinished}
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
                        <FormSelect
                          title="Round format"
                          options={roundFormatOptions}
                          selected={round.format}
                          disabled={isFinished || round.results.length > 0}
                          setSelected={(val: string) => changeRoundFormat(eventIndex, roundIndex, val as RoundFormat)}
                        />
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
                          setValue={(val: string) =>
                            changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)
                          }
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
              events={filteredEvents}
              eventId={mainEventId}
              setEventId={setMainEventId}
              disabled={isNotCreated}
            />
          </>
        )}

        {activeTab === 3 && (
          <>
            <h3 className="mb-3">Rooms</h3>
            <div className="row">
              <div className="col-8">
                <FormTextInput title="Room name" value={roomName} setValue={setRoomName} />
              </div>
              <div className="col-3">
                <FormSelect title="Color" options={colorOptions} selected={roomColor} setSelected={setRoomColor} />
              </div>
              <div className="col-1 d-flex align-items-end">
                <span
                  style={{
                    marginBottom: '19px',
                    width: '100%',
                    height: '2rem',
                    borderRadius: '5px',
                    backgroundColor: `#${roomColor}`,
                  }}
                ></span>
              </div>
            </div>
            <button type="button" className="mt-3 mb-2 btn btn-success" disabled={!isValidRoom} onClick={addRoom}>
              Create
            </button>

            <hr />

            <h3 className="mb-3">Schedule</h3>
            <div className="mb-3 row">
              <div className="col">
                <FormSelect
                  title="Room"
                  options={roomOptions}
                  selected={selectedRoom}
                  disabled={rooms.length === 0}
                  setSelected={setSelectedRoom}
                />
              </div>
              <div className="col">
                <FormTextInput title="Activity code (TEMPORARY)" value={activityCode} setValue={setActivityCode} />
              </div>
            </div>
            <div className="mb-3 row">
              <div className="col">
                <label htmlFor="activity_start_time" className="form-label">
                  Start time ({venueTimezone})
                </label>
                <DatePicker
                  id="activity_start_time"
                  selected={utcToZonedTime(activityStartTime, venueTimezone)}
                  showTimeSelect
                  timeIntervals={15}
                  timeFormat="p"
                  dateFormat="Pp"
                  locale="en-GB"
                  onChange={(date: Date) => changeActivityStartTime(date)}
                  className="form-control"
                />
              </div>
              <div className="col">
                <label htmlFor="activity_end_time" className="form-label">
                  End time ({venueTimezone})
                </label>
                <DatePicker
                  id="activity_end_time"
                  selected={utcToZonedTime(activityEndTime, venueTimezone)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  dateFormat="HH:mm"
                  onChange={(date: Date) => changeActivityEndTime(date)}
                  className="form-control"
                />
              </div>
            </div>
            <button
              type="button"
              className="mt-3 mb-2 btn btn-success"
              disabled={!isValidActivity}
              onClick={addActivity}
            >
              Add to schedule
            </button>
          </>
        )}
      </Form>

      {activeTab === 3 && <Schedule rooms={rooms} compEvents={competitionEvents} timezone={venueTimezone} />}
    </>
  );
};

export default CompetitionForm;
