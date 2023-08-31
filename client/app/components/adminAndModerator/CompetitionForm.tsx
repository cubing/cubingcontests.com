'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import { addHours, differenceInDays } from 'date-fns';
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
import { ICompetition, ICompetitionDetails, ICompetitionEvent, IEvent, IPerson, IRoom, IRound } from '@sh/interfaces';
import {
  Color,
  CompetitionState,
  CompetitionType,
  EventGroup,
  Role,
  RoundFormat,
  RoundProceed,
  RoundType,
} from '@sh/enums';
import { getDateOnly } from '@sh/sharedFunctions';
import {
  colorOptions,
  competitionTypeOptions,
  roundFormatOptions,
  roundProceedOptions,
} from '~/helpers/multipleChoiceOptions';
import { roundTypes } from '~/helpers/roundTypes';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import { limitRequests } from '~/helpers/utilityFunctions';
import Loading from '../Loading';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const coordToMicrodegrees = (value: string): number | null => {
  if (!value) return null;
  return parseInt(Number(value).toFixed(6).replace('.', ''));
};

const CompetitionForm = ({
  events,
  competition,
  mode,
  role,
}: {
  events: IEvent[];
  competition?: ICompetition;
  mode: 'new' | 'edit' | 'copy';
  role: Role;
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [fetchTimezoneTimer, setFetchTimezoneTimer] = useState<NodeJS.Timeout>(null);

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(CompetitionType.Meetup);
  const [city, setCity] = useState('');
  const [countryIso2, setCountryId] = useState('NOT_SELECTED');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('0'); // vertical coordinate (Y); ranges from -90 to 90
  const [longitude, setLongitude] = useState('0'); // horizontal coordinate (X); ranges from -180 to 180
  const [startDate, setStartDate] = useState(addHours(getDateOnly(new Date()), 12)); // use 12:00 as default start time
  const [endDate, setEndDate] = useState(new Date());
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
  const [venueTimezone, setVenueTimezone] = useState('GMT'); // e.g. Europe/Berlin
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomColor, setRoomColor] = useState<Color>(Color.White);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState('');
  // These are in UTC, but get displayed in the local time zone of the venue. Set to 12:00 - 13:00 by default.
  const [activityStartTime, setActivityStartTime] = useState<Date>(addHours(getDateOnly(new Date()), 12));
  const [activityEndTime, setActivityEndTime] = useState<Date>(addHours(getDateOnly(new Date()), 13));

  const isAdmin = role === Role.Admin;
  competitionTypeOptions[2].disabled = !isAdmin; // only enable competition type for admins

  const tabs = useMemo(
    () => (type === CompetitionType.Competition ? ['Details', 'Events', 'Schedule'] : ['Details', 'Events']),
    [type],
  );
  const filteredEvents = useMemo(() => {
    const newFiltEv = events.filter(
      (ev) =>
        ev.groups.some((g) => [EventGroup.WCA, EventGroup.Unofficial].includes(g)) &&
        (type === CompetitionType.Meetup || !ev.groups.includes(EventGroup.MeetupOnly)),
    );

    // Reset new event ID and main event ID if new filtered events don't include them
    if (newFiltEv.length > 0) {
      if (!newFiltEv.some((ev) => ev.eventId === newEventId)) setNewEventId(newFiltEv[0]?.eventId);
      if (!newFiltEv.some((ev) => ev.eventId === mainEventId)) setMainEventId(newFiltEv[0]?.eventId);
    }

    return newFiltEv;
  }, [events, type, mainEventId]);
  const remainingEvents = useMemo(
    () => filteredEvents.filter((ev) => !competitionEvents.some((ce) => ce.event.eventId === ev.eventId)),
    [filteredEvents, competitionEvents],
  );
  const disableIfCompFinished = useMemo(
    () => !isAdmin && mode === 'edit' && competition.state >= CompetitionState.Finished,
    [competition, mode, isAdmin],
  );
  // This has been nominated for the best variable name award!
  const disableIfCompFinishedEvenForAdmin = useMemo(
    () => mode === 'edit' && competition.state >= CompetitionState.Finished,
    [competition, mode, isAdmin],
  );
  const disableIfCompApproved = useMemo(
    () => !isAdmin && mode === 'edit' && competition.state >= CompetitionState.Approved,
    [competition, mode, isAdmin],
  );
  const disableIfCompApprovedEvenForAdmin = useMemo(
    () => mode === 'edit' && competition.state >= CompetitionState.Approved,
    [competition, mode],
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
  const displayedStartDate = useMemo(
    () => (startDate && type === CompetitionType.Meetup ? utcToZonedTime(startDate, venueTimezone) : startDate),
    [startDate, type, venueTimezone],
  );

  //////////////////////////////////////////////////////////////////////////////
  // Use effect
  //////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (mode !== 'new') {
      setCompetitionId(competition.competitionId);
      setName(competition.name);
      setType(competition.type);
      if (competition.city) setCity(competition.city);
      setCountryId(competition.countryIso2);
      if (competition.venue) setVenue(competition.venue);
      if (competition.address) setAddress(competition.address);
      if (competition.latitudeMicrodegrees && competition.longitudeMicrodegrees) {
        setLatitude((competition.latitudeMicrodegrees / 1000000).toFixed(6));
        setLongitude((competition.longitudeMicrodegrees / 1000000).toFixed(6));
      }
      setOrganizerNames([...competition.organizers.map((el) => el.name), '']);
      setOrganizers([...competition.organizers, null]);
      if (competition.contact) setContact(competition.contact);
      if (competition.description) setDescription(competition.description);
      if (competition.competitorLimit) setCompetitorLimit(competition.competitorLimit.toString());
      setNewEventId(
        events.find((ev) => !competition.events.some((ce) => ce.event.eventId === ev.eventId))?.eventId || '333',
      );
      setMainEventId(competition.mainEventId);

      switch (competition.type) {
        case CompetitionType.Meetup: {
          setStartDate(new Date(competition.startDate));
          setVenueTimezone(competition.timezone);
          break;
        }
        case CompetitionType.Competition: {
          // Convert the dates from string to Date
          setStartDate(new Date(competition.startDate));
          setEndDate(new Date(competition.endDate));

          const venue = competition.compDetails.schedule.venues[0];
          setRooms(venue.rooms);
          setVenueTimezone(venue.timezone);
          break;
        }
        case CompetitionType.Online: {
          setStartDate(new Date(competition.startDate));
          break;
        }
        default:
          throw new Error(`Unknown contest type: ${competition.type}`);
      }

      if (mode === 'copy') {
        // Remove the round IDs and all results
        setCompetitionEvents(
          competition.events.map((ce) => ({
            ...ce,
            rounds: ce.rounds.map((r) => ({ ...r, _id: undefined, results: [] })),
          })),
        );
      } else if (mode === 'edit') {
        setCompetitionEvents(competition.events);
      }
    }
  }, [competition, events]);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (errorMessages.find((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages]);

  useEffect(() => {
    if (organizers.length !== 1 && organizers.filter((el) => el === null).length === 1) {
      document.getElementById(`Organizer_${organizerNames.length}`)?.focus();
    }
  }, [organizers]);

  // TEMPORARY FOR DEBUGGING!!!
  useEffect(() => {
    if (startDate) console.log(startDate.toUTCString());
  }, [startDate]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (!startDate || (type === CompetitionType.Competition && !endDate)) {
      setErrorMessages(['Please enter valid dates']);
      return;
    }

    const selectedOrganizers = organizers.filter((el) => el !== null);
    const latitudeMicrodegrees = type !== CompetitionType.Online ? coordToMicrodegrees(latitude) : undefined;
    const longitudeMicrodegrees = type !== CompetitionType.Online ? coordToMicrodegrees(longitude) : undefined;
    let processedStartDate = startDate;
    const endDateOnly = getDateOnly(endDate);

    if (type === CompetitionType.Competition) processedStartDate = getDateOnly(startDate);

    const getRoundDate = (round: IRound): Date => {
      switch (type) {
        // If it's a meetup, get the real date using the time zone (it could be different from the UTC date)
        case CompetitionType.Meetup: {
          return getDateOnly(utcToZonedTime(startDate, venueTimezone));
        }
        // If it's a competition, find the start time of the round using the schedule and get
        // the date using the time zone. Again, the date could be different from the UTC date.
        case CompetitionType.Competition: {
          let roundStartTime: Date;

          for (const room of rooms) {
            const activity = room.activities.find((a) => a.activityCode === round.roundId);

            if (activity) {
              roundStartTime = activity.startTime;
              break;
            }
          }

          return getDateOnly(utcToZonedTime(roundStartTime, venueTimezone));
        }
        // If it's an online comp, just get the date
        case CompetitionType.Online: {
          return getDateOnly(startDate);
        }
      }
    };

    // Set the competition ID and date for every round
    const compEvents = competitionEvents.map((compEvent) => ({
      ...compEvent,
      rounds: compEvent.rounds.map((round) => ({ ...round, competitionId, date: getRoundDate(round) })),
    }));

    let compDetails: ICompetitionDetails; // this is left undefined if the type is not competition

    if (type === CompetitionType.Competition) {
      compDetails = {
        schedule: {
          competitionId,
          startDate: processedStartDate,
          numberOfDays: differenceInDays(endDateOnly, processedStartDate) + 1,
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
      };
    }

    const newComp: ICompetition = {
      competitionId,
      name: name.trim(),
      type,
      city: type !== CompetitionType.Online ? city.trim() : undefined,
      // If it's an online competition, set country ISO to online
      countryIso2: type !== CompetitionType.Online ? countryIso2 : 'ONLINE',
      venue: type !== CompetitionType.Online ? venue.trim() : undefined,
      address: type !== CompetitionType.Online ? address.trim() : undefined,
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate: processedStartDate,
      endDate: type === CompetitionType.Competition ? endDateOnly : undefined,
      organizers: selectedOrganizers,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit && !isNaN(parseInt(competitorLimit)) ? parseInt(competitorLimit) : undefined,
      mainEventId,
      events: compEvents,
      compDetails,
    };

    if (mode === 'edit') {
      newComp.createdBy = competition.createdBy;
      newComp.state = competition.state;
      newComp.participants = competition.participants;
      if (type === CompetitionType.Meetup) newComp.timezone = competition.timezone;
    }

    // Validation
    const tempErrors: string[] = [];

    if (mode === 'copy') {
      if (newComp.competitionId === competition.competitionId) tempErrors.push('The competition ID cannot be the same');
      if (newComp.name === competition.name) tempErrors.push('The competition name cannot be the same');
    }

    if (!newComp.competitionId) tempErrors.push('Please enter a competition ID');
    if (!newComp.name) tempErrors.push('Please enter a name');

    if (selectedOrganizers.length < organizerNames.filter((el) => el !== '').length)
      tempErrors.push('Please enter all organizers');
    else if (newComp.organizers.length === 0) tempErrors.push('Please enter at least one organizer');

    if (newComp.events.length === 0) tempErrors.push('You must enter at least one event');
    else if (!competitionEvents.some((el) => el.event.eventId === mainEventId))
      tempErrors.push('The selected main event is not on the list of events');

    const meetupOnlyCompEvent = competitionEvents.find((el) => el.event.groups.includes(EventGroup.MeetupOnly));
    if (type !== CompetitionType.Meetup && meetupOnlyCompEvent)
      tempErrors.push(`The event ${meetupOnlyCompEvent.event.name} is only allowed for meetups`);

    if (type === CompetitionType.Competition) {
      if (!newComp.contact) tempErrors.push('Please enter a contact email');
      if (!newComp.competitorLimit) tempErrors.push('Please enter a valid competitor limit');
      if (newComp.startDate > newComp.endDate) tempErrors.push('The start date must be before the end date');
    }

    if (type !== CompetitionType.Online) {
      if (!newComp.city) tempErrors.push('Please enter a city');
      if (['NOT_SELECTED', 'ONLINE'].includes(newComp.countryIso2)) tempErrors.push('Please select a country');
      if (!newComp.venue) tempErrors.push('Please enter a venue');
      if (!newComp.address) tempErrors.push('Please enter an address');
      if (newComp.latitudeMicrodegrees === null || newComp.longitudeMicrodegrees === null)
        tempErrors.push('Please enter valid venue coordinates');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const { errors } =
        mode === 'edit'
          ? await myFetch.patch(`/competitions/${competition.competitionId}`, newComp) // edit competition
          : await myFetch.post('/competitions', newComp); // create competition

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        window.location.href = '/mod';
      }
    }
  };

  // Disallows Mo3 format for events that have Ao5 as the default format, and vice versa for all other events
  const getFilteredRoundFormats = (event: IEvent): MultiChoiceOption[] => {
    if (event.defaultRoundFormat === RoundFormat.Average) {
      return roundFormatOptions.filter((el) => el.value !== RoundFormat.Mean);
    } else {
      return roundFormatOptions.filter((el) => el.value !== RoundFormat.Average);
    }
  };

  const changeActiveTab = (newTab: number) => {
    if (newTab === 2 && (!latitude || !longitude)) {
      setErrorMessages(['Please enter the coordinates first']);
    } else {
      setActiveTab(newTab);
    }
  };

  const changeName = (value: string) => {
    // If not editing a competition, update Competition ID accordingly, unless it deviates from the name
    if (mode !== 'edit' && competitionId === name.replaceAll(/[^a-zA-Z0-9]/g, '')) {
      setCompetitionId(value.replaceAll(/[^a-zA-Z0-9]/g, ''));
    }

    setName(value);
  };

  const changeType = (newType: CompetitionType) => {
    setType(newType);
  };

  const changeCoordinates = async (newLat: string, newLong: string) => {
    const getIsValidCoord = (val: string) => !/[^0-9.-]/.test(val) && !isNaN(Number(val));

    if (getIsValidCoord(newLat) && getIsValidCoord(newLong)) {
      const processedLatitude = Math.min(Math.max(Number(newLat), -90), 90);
      const processedLongitude = Math.min(Math.max(Number(newLong), -180), 180);

      setLatitude(processedLatitude.toString());
      setLongitude(processedLongitude.toString());

      limitRequests(fetchTimezoneTimer, setFetchTimezoneTimer, async () => {
        const { errors, payload } = await myFetch.get(
          `/competitions/timezone?latitude=${processedLatitude}&longitude=${processedLongitude}`,
          { authorize: true },
        );

        if (errors) {
          setErrorMessages(errors);
        } else {
          setVenueTimezone(payload.timezone);

          // Adjust times to the new time zone
          if (type === CompetitionType.Meetup) {
            setStartDate(zonedTimeToUtc(utcToZonedTime(startDate, venueTimezone), payload.timezone));
          } else if (type === CompetitionType.Competition) {
            setActivityStartTime(zonedTimeToUtc(utcToZonedTime(activityStartTime, venueTimezone), payload.timezone));
            setActivityEndTime(zonedTimeToUtc(utcToZonedTime(activityEndTime, venueTimezone), payload.timezone));
            setRooms(
              rooms.map((r) => ({
                ...r,
                activities: r.activities.map((a) => ({
                  ...a,
                  startTime: zonedTimeToUtc(utcToZonedTime(a.startTime, venueTimezone), payload.timezone),
                  endTime: zonedTimeToUtc(utcToZonedTime(a.endTime, venueTimezone), payload.timezone),
                })),
              })),
            );
          }
        }
      });
    }
  };

  const changeStartDate = (newDate: Date) => {
    if (newDate && type === CompetitionType.Meetup) {
      setStartDate(zonedTimeToUtc(newDate, venueTimezone));
    } else {
      setStartDate(newDate);
    }
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
    if (newTime) setActivityStartTime(zonedTimeToUtc(newTime, venueTimezone));
    else setActivityStartTime(newTime);
  };

  // Get the same date as the start time and use the new end time (the end time input is for time only)
  const changeActivityEndTime = (newTime: Date) => {
    if (newTime) {
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
    } else {
      setActivityEndTime(newTime);
    }
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
        buttonText={mode === 'edit' ? 'Edit Contest' : 'Create Contest'}
        errorMessages={errorMessages}
        handleSubmit={handleSubmit}
        hideButton={activeTab === 2}
        disableButton={disableIfCompFinished || fetchTimezoneTimer !== null}
      >
        <Tabs titles={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

        {activeTab === 0 && (
          <>
            <FormTextInput
              title="Contest name"
              value={name}
              setValue={changeName}
              autoFocus
              disabled={disableIfCompApproved}
            />
            <FormTextInput
              title="Contest ID"
              value={competitionId}
              setValue={setCompetitionId}
              disabled={mode === 'edit'}
            />
            <FormRadio
              title="Type"
              options={competitionTypeOptions}
              selected={type}
              setSelected={(val: any) => changeType(val)}
              disabled={mode !== 'new'}
            />
            {type !== CompetitionType.Online && (
              <>
                <div className="row">
                  <div className="col">
                    <FormTextInput title="City" value={city} setValue={setCity} disabled={disableIfCompApproved} />
                  </div>
                  <div className="col">
                    <FormCountrySelect
                      countryIso2={countryIso2}
                      setCountryId={setCountryId}
                      disabled={mode === 'edit'}
                    />
                  </div>
                </div>
                <FormTextInput title="Address" value={address} setValue={setAddress} disabled={disableIfCompApproved} />
                <div className="row">
                  <div className="col-6">
                    <FormTextInput title="Venue" value={venue} setValue={setVenue} disabled={disableIfCompApproved} />
                  </div>
                  <div className="col-3">
                    <FormTextInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val: string) => changeCoordinates(val, longitude)}
                      disabled={disableIfCompApprovedEvenForAdmin}
                    />
                  </div>
                  <div className="col-3">
                    <FormTextInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val: string) => changeCoordinates(latitude, val)}
                      disabled={disableIfCompApprovedEvenForAdmin}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="mb-3 row">
              <div className="col">
                <label htmlFor="start_date" className="form-label">
                  {type === CompetitionType.Competition ? (
                    'Start date'
                  ) : (
                    <>
                      Start date and time
                      {type === CompetitionType.Online ? (
                        ' (UTC)'
                      ) : fetchTimezoneTimer === null ? (
                        ` (${venueTimezone})`
                      ) : (
                        <Loading small dontCenter />
                      )}
                    </>
                  )}
                </label>
                <DatePicker
                  id="start_date"
                  selected={displayedStartDate}
                  showTimeSelect={type !== CompetitionType.Competition}
                  timeFormat="p"
                  // P is date select only, Pp is date and time select
                  dateFormat={type === CompetitionType.Competition ? 'P' : 'Pp'}
                  locale="en-GB"
                  onChange={(date: Date) => changeStartDate(date)}
                  className="form-control"
                  disabled={disableIfCompApprovedEvenForAdmin}
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
                    disabled={disableIfCompApprovedEvenForAdmin}
                  />
                </div>
              )}
            </div>
            <h5>Organizers</h5>
            <div className="my-3 pt-3 px-4 border rounded bg-body-tertiary">
              <FormPersonInputs
                title="Organizer"
                personNames={organizerNames}
                setPersonNames={setOrganizerNames}
                persons={organizers}
                setPersons={setOrganizers}
                setErrorMessages={setErrorMessages}
                infiniteInputs
                nextFocusTargetId="contact"
                disabled={disableIfCompFinished}
                addNewPersonFromNewTab
              />
            </div>
            <FormTextInput
              id="contact"
              title={'Contact' + (type !== CompetitionType.Competition ? ' (optional)' : '')}
              placeholder="john@example.com"
              value={contact}
              setValue={setContact}
              disabled={disableIfCompFinished}
            />
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
                disabled={disableIfCompFinished}
              />
            </div>
            <FormTextInput
              title={'Competitor limit' + (type !== CompetitionType.Competition ? ' (optional)' : '')}
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={disableIfCompApproved}
            />
          </>
        )}

        {activeTab === 1 && (
          <>
            <div className="my-4 d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-success"
                onClick={addCompetitionEvent}
                disabled={disableIfCompFinishedEvenForAdmin || competitionEvents.length === filteredEvents.length}
              >
                Add Event
              </button>
              <div className="flex-grow-1">
                <FormEventSelect
                  title=""
                  noMargin
                  events={remainingEvents}
                  eventId={newEventId}
                  setEventId={setNewEventId}
                  disabled={disableIfCompFinishedEvenForAdmin}
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
                    disabled={disableIfCompFinishedEvenForAdmin || compEvent.rounds.some((r) => r.results.length > 0)}
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
                          options={getFilteredRoundFormats(compEvent.event)}
                          selected={round.format}
                          disabled={disableIfCompFinishedEvenForAdmin || round.results.length > 0}
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
                          disabled={disableIfCompFinishedEvenForAdmin || round.results.length > 0}
                        />
                        <FormTextInput
                          id="round_proceed_value"
                          value={round.proceed.value.toString()}
                          setValue={(val: string) =>
                            changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)
                          }
                          disabled={disableIfCompFinishedEvenForAdmin || round.results.length > 0}
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
                      disabled={disableIfCompFinishedEvenForAdmin}
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
                        disableIfCompFinishedEvenForAdmin ||
                        compEvent.rounds.find((r) => r.roundTypeId === RoundType.Final).results.length > 0
                      }
                    >
                      Remove Round
                    </button>
                  )}
                </div>
              </div>
            ))}
            <FormEventSelect
              title="Main Event"
              events={filteredEvents}
              eventId={mainEventId}
              setEventId={setMainEventId}
              disabled={disableIfCompApproved}
            />
          </>
        )}

        {activeTab === 2 && (
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
                  selected={activityStartTime && utcToZonedTime(activityStartTime, venueTimezone)}
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
                  selected={activityEndTime && utcToZonedTime(activityEndTime, venueTimezone)}
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

      {activeTab === 2 && <Schedule rooms={rooms} compEvents={competitionEvents} timezone={venueTimezone} />}
    </>
  );
};

export default CompetitionForm;
