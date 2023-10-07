'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import { addHours, differenceInDays, format, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormEventSelect from '@c/form/FormEventSelect';
import FormRadio from '@c/form/FormRadio';
import FormSelect from '@c/form/FormSelect';
import FormPersonInputs from '@c/form/FormPersonInputs';
import FormNumberInput from '@c/form/FormNumberInput';
import FormTextArea from '@c/form/FormTextArea';
import EventTitle from '@c/EventTitle';
import Tabs from '@c/Tabs';
import Schedule from '@c/Schedule';
import ColorSquare from '@c/ColorSquare';
import { IContest, ICompetitionDetails, IContestEvent, IEvent, IPerson, IRoom, IRound } from '@sh/interfaces';
import { Color, ContestState, ContestType, EventGroup, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { getDateOnly } from '@sh/sharedFunctions';
import {
  colorOptions,
  contestTypeOptions,
  roundFormatOptions,
  roundProceedOptions,
} from '~/helpers/multipleChoiceOptions';
import { roundTypes } from '~/helpers/roundTypes';
import { getContestIdFromName, getUserInfo, limitRequests } from '~/helpers/utilityFunctions';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import C from '@sh/constants';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const isAdmin = getUserInfo()?.isAdmin;

const ContestForm = ({
  events,
  contest,
  mode,
}: {
  events: IEvent[];
  contest?: IContest;
  mode: 'new' | 'edit' | 'copy';
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [fetchTimezoneTimer, setFetchTimezoneTimer] = useState<NodeJS.Timeout>(null);

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(ContestType.Meetup);
  const [city, setCity] = useState('');
  const [countryIso2, setCountryId] = useState('NOT_SELECTED');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0); // vertical coordinate (Y); ranges from -90 to 90
  const [longitude, setLongitude] = useState(0); // horizontal coordinate (X); ranges from -180 to 180
  const [startDate, setStartDate] = useState(addHours(getDateOnly(new Date()), 12)); // use 12:00 as default start time
  const [endDate, setEndDate] = useState(new Date());
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState<number>(undefined);

  // Event stuff
  const [newEventId, setNewEventId] = useState('333');
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>([]);
  const [mainEventId, setMainEventId] = useState('333');

  // Schedule stuff
  const [venueTimezone, setVenueTimezone] = useState('GMT'); // e.g. Europe/Berlin
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomColor, setRoomColor] = useState<Color>(Color.White);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  // These are in UTC, but get displayed in the local time zone of the venue. Set to 12:00 - 13:00 by default.
  const [activityStartTime, setActivityStartTime] = useState<Date>(addHours(getDateOnly(new Date()), 12));
  const [activityEndTime, setActivityEndTime] = useState<Date>(addHours(getDateOnly(new Date()), 13));

  //////////////////////////////////////////////////////////////////////////////
  // Use memo
  //////////////////////////////////////////////////////////////////////////////

  const tabs = useMemo(
    () => [
      { title: 'Details', value: 'details' },
      { title: 'Events', value: 'events' },
      { title: 'Schedule', value: 'schedule', hidden: type !== ContestType.Competition },
    ],
    [type],
  );
  const filteredEvents = useMemo(() => {
    const newFiltEv = events.filter(
      (ev) => isAdmin || !ev.groups.some((g) => [EventGroup.ExtremeBLD, EventGroup.Removed].includes(g)),
    );

    // Reset new event ID and main event ID if new filtered events don't include them
    if (newFiltEv.length > 0) {
      if (!newFiltEv.some((ev) => ev.eventId === newEventId)) setNewEventId(newFiltEv[0]?.eventId);
      if (!newFiltEv.some((ev) => ev.eventId === mainEventId)) setMainEventId(newFiltEv[0]?.eventId);
    }

    return newFiltEv;
  }, [events, type, mainEventId, newEventId]);
  const remainingEvents = useMemo(
    () => filteredEvents.filter((ev) => !contestEvents.some((ce) => ce.event.eventId === ev.eventId)),
    [filteredEvents, contestEvents],
  );
  const disableIfCompFinished = useMemo(
    () => !isAdmin && mode === 'edit' && contest.state >= ContestState.Finished,
    [contest, mode, isAdmin],
  );
  // This has been nominated for the best variable name award!
  const disableIfCompFinishedEvenForAdmin = useMemo(
    () => mode === 'edit' && contest.state >= ContestState.Finished,
    [contest, mode, isAdmin],
  );
  const disableIfCompApproved = useMemo(
    () => !isAdmin && mode === 'edit' && contest.state >= ContestState.Approved,
    [contest, mode, isAdmin],
  );
  const disableIfCompApprovedEvenForAdmin = useMemo(
    () => mode === 'edit' && contest.state >= ContestState.Approved,
    [contest, mode],
  );
  const displayedStartDate = useMemo(
    () => (startDate && type === ContestType.Meetup ? utcToZonedTime(startDate, venueTimezone) : startDate),
    [startDate, type, venueTimezone],
  );
  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: room.name,
        value: room.id,
      })),
    [rooms.length],
  );
  const activityOptions = useMemo(() => {
    const output: MultiChoiceOption[] = [];

    for (const contestEvent of contestEvents) {
      for (const round of contestEvent.rounds) {
        // Add all rounds not already added to the schedule as activity code options
        if (!rooms.some((r) => r.activities.some((a) => a.activityCode === round.roundId))) {
          output.push({
            label: `${contestEvent.event.name} ${roundTypes[round.roundTypeId].label}`,
            value: round.roundId,
          });
        }
      }
    }

    output.push({ label: 'Custom', value: 'other-misc' });
    setActivityCode(output[0].value as string); // set selected activity code as the first available option
    return output;
  }, [contestEvents, rooms]);
  const isValidActivity = useMemo(
    () =>
      activityCode &&
      (activityCode !== 'other-misc' || customActivity) &&
      roomOptions.some((el) => el.value === selectedRoom),
    [activityCode, customActivity, roomOptions, selectedRoom],
  );

  //////////////////////////////////////////////////////////////////////////////
  // Use effect
  //////////////////////////////////////////////////////////////////////////////

  // TEMPORARY FOR DEBUGGING
  useEffect(() => {
    console.log('Rooms', rooms, '| selected room:', selectedRoom);
  }, [rooms, selectedRoom]);

  useEffect(() => {
    if (mode !== 'new') {
      setCompetitionId(contest.competitionId);
      setName(contest.name);
      setType(contest.type);
      if (contest.city) setCity(contest.city);
      setCountryId(contest.countryIso2);
      if (contest.venue) setVenue(contest.venue);
      if (contest.address) setAddress(contest.address);
      if (contest.latitudeMicrodegrees && contest.longitudeMicrodegrees) {
        setLatitude(contest.latitudeMicrodegrees / 1000000);
        setLongitude(contest.longitudeMicrodegrees / 1000000);
      }
      setOrganizerNames([...contest.organizers.map((el) => el.name), '']);
      setOrganizers([...contest.organizers, null]);
      if (contest.contact) setContact(contest.contact);
      if (contest.description) setDescription(contest.description);
      if (contest.competitorLimit) setCompetitorLimit(contest.competitorLimit);
      setNewEventId(
        events.find((ev) => !contest.events.some((ce) => ce.event.eventId === ev.eventId))?.eventId || '333',
      );
      setMainEventId(contest.mainEventId);

      switch (contest.type) {
        case ContestType.Meetup: {
          setStartDate(new Date(contest.startDate));
          setVenueTimezone(contest.timezone);
          break;
        }
        case ContestType.Competition: {
          // Convert the dates from string to Date
          setStartDate(new Date(contest.startDate));
          setEndDate(new Date(contest.endDate));

          const setDefaultActivityTimes = (timezone: string) => {
            setActivityStartTime(zonedTimeToUtc(addHours(new Date(contest.startDate), 12), timezone));
            setActivityEndTime(zonedTimeToUtc(addHours(new Date(contest.startDate), 13), timezone));
          };

          if (contest.compDetails) {
            const venue = contest.compDetails.schedule.venues[0];
            setRooms(venue.rooms);
            setVenueTimezone(venue.timezone);
            setDefaultActivityTimes(venue.timezone);
          } else {
            fetchTimezone(contest.latitudeMicrodegrees / 1000000, contest.longitudeMicrodegrees / 1000000).then(
              (timezone) => setDefaultActivityTimes(timezone),
            );
          }
          break;
        }
        case ContestType.Online: {
          setStartDate(new Date(contest.startDate));
          break;
        }
        default:
          throw new Error(`Unknown contest type: ${contest.type}`);
      }

      if (mode === 'copy') {
        // Remove the round IDs and all results
        setContestEvents(
          contest.events.map((ce) => ({
            ...ce,
            rounds: ce.rounds.map((r) => ({ ...r, _id: undefined, results: [] })),
          })),
        );
      } else if (mode === 'edit') {
        setContestEvents(contest.events);
      }
    }
  }, [contest, events]);

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
    if (!startDate || (type === ContestType.Competition && !endDate)) {
      setErrorMessages(['Please enter valid dates']);
      return;
    }

    const selectedOrganizers = organizers.filter((el) => el !== null);
    let latitudeMicrodegrees: number, longitudeMicrodegrees: number;
    if (type !== ContestType.Online) {
      if (latitude) latitudeMicrodegrees = Math.round(latitude * 1000000);
      if (longitude) longitudeMicrodegrees = Math.round(longitude * 1000000);
    }
    const processedStartDate = type === ContestType.Competition ? getDateOnly(startDate) : startDate;
    const endDateOnly = getDateOnly(endDate);

    const getRoundDate = (round: IRound): Date => {
      switch (type) {
        // If it's a meetup, get the real date using the time zone (it could be different from the UTC date)
        case ContestType.Meetup: {
          return getDateOnly(utcToZonedTime(startDate, venueTimezone));
        }
        // If it's a competition, find the start time of the round using the schedule and get
        // the date using the time zone. Again, the date could be different from the UTC date.
        case ContestType.Competition: {
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
        case ContestType.Online: {
          return getDateOnly(startDate);
        }
      }
    };

    // Set the competition ID and date for every round and empty results if there were any from
    // editing the contest, in order to avoid sending too much data to the backend
    const processedCompEvents = contestEvents.map((ce) => ({
      ...ce,
      rounds: ce.rounds.map((round) => ({ ...round, competitionId, date: getRoundDate(round), results: [] })),
    }));

    let compDetails: ICompetitionDetails; // this is left undefined if the type is not competition

    if (type === ContestType.Competition) {
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

    const newComp: IContest = {
      competitionId,
      name: name.trim(),
      type,
      city: type !== ContestType.Online ? city.trim() : undefined,
      // If it's an online competition, set country ISO to online
      countryIso2: type !== ContestType.Online ? countryIso2 : 'ONLINE',
      venue: type !== ContestType.Online ? venue.trim() : undefined,
      address: type !== ContestType.Online ? address.trim() : undefined,
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate: processedStartDate,
      endDate: type === ContestType.Competition ? endDateOnly : undefined,
      organizers: selectedOrganizers,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit || undefined,
      mainEventId,
      events: processedCompEvents,
      compDetails,
    };

    if (mode === 'edit') {
      newComp.createdBy = contest.createdBy;
      newComp.state = contest.state;
      newComp.participants = contest.participants;
      if (type === ContestType.Meetup) newComp.timezone = contest.timezone;
    }

    // Validation
    const tempErrors: string[] = [];

    if (selectedOrganizers.length < organizerNames.filter((el) => el !== '').length)
      tempErrors.push('Please enter all organizers');

    if (contestEvents.length > 0 && !contestEvents.some((el) => el.event.eventId === mainEventId))
      tempErrors.push('The selected main event is not on the list of events');

    if (type === ContestType.Competition) {
      if (newComp.startDate > newComp.endDate) tempErrors.push('The start date must be before the end date');
      if (activityOptions.length > 1) tempErrors.push('Please add all rounds to the schedule');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const { errors } =
        mode === 'edit'
          ? await myFetch.patch(`/competitions/${contest.competitionId}`, newComp)
          : await myFetch.post('/competitions', newComp);

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        window.location.href = '/mod';
      }
    }
  };

  const changeActiveTab = (newTab: string) => {
    if (newTab === 'schedule' && (latitude === null || longitude === null)) {
      setErrorMessages(['Please enter valid coordinates first']);
    } else {
      setActiveTab(newTab);
    }
  };

  const changeName = (value: string) => {
    // If not editing a competition, update Competition ID accordingly, unless it deviates from the name
    if (mode !== 'edit' && competitionId === getContestIdFromName(name)) {
      setCompetitionId(getContestIdFromName(value));
    }

    setName(value);
  };

  const changeType = (newType: ContestType) => {
    setType(newType);
  };

  const fetchTimezone = async (lat: number, long: number): Promise<string> => {
    const { errors, payload } = await myFetch.get(`/timezone?latitude=${lat}&longitude=${long}`, { authorize: true });

    if (errors) {
      setErrorMessages(errors);
      Promise.reject();
    } else {
      setVenueTimezone(payload.timezone);
      return payload.timezone;
    }
  };

  const changeCoordinates = async (newLat: number, newLong: number) => {
    if (newLat === null || newLong === null) {
      setLatitude(newLat);
      setLongitude(newLong);
    } else {
      const processedLatitude = Math.min(Math.max(Number(newLat), -90), 90);
      const processedLongitude = Math.min(Math.max(Number(newLong), -180), 180);

      setLatitude(processedLatitude);
      setLongitude(processedLongitude);

      limitRequests(fetchTimezoneTimer, setFetchTimezoneTimer, async () => {
        fetchTimezone(processedLatitude, processedLongitude).then((timezone: string) => {
          // Adjust times to the new time zone
          if (type === ContestType.Meetup) {
            setStartDate(zonedTimeToUtc(utcToZonedTime(startDate, venueTimezone), timezone));
          } else if (type === ContestType.Competition) {
            setActivityStartTime(zonedTimeToUtc(utcToZonedTime(activityStartTime, venueTimezone), timezone));
            setActivityEndTime(zonedTimeToUtc(utcToZonedTime(activityEndTime, venueTimezone), timezone));
            setRooms(
              rooms.map((r) => ({
                ...r,
                activities: r.activities.map((a) => ({
                  ...a,
                  startTime: zonedTimeToUtc(utcToZonedTime(a.startTime, venueTimezone), timezone),
                  endTime: zonedTimeToUtc(utcToZonedTime(a.endTime, venueTimezone), timezone),
                })),
              })),
            );
          }
        });
      });
    }
  };

  const changeStartDate = (newDate: Date) => {
    if (newDate && type === ContestType.Meetup) {
      setStartDate(zonedTimeToUtc(newDate, venueTimezone));
    } else {
      setStartDate(newDate);
    }
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newContestEvents = contestEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundProceed = (eventIndex: number, roundIndex: number, type: RoundProceed, newVal?: number) => {
    const newContestEvents = contestEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : { ...round, proceed: { type, value: newVal === undefined ? round.proceed.value : newVal } },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  const getNewRound = (eventId: string, roundNumber: number): IRound => {
    return {
      roundId: `${eventId}-r${roundNumber}`,
      competitionId: 'temp', // this gets replaced for all rounds on submit
      date: startDate,
      roundTypeId: RoundType.Final,
      format: events.find((el) => el.eventId === eventId).defaultRoundFormat,
      results: [],
    };
  };

  const addRound = (eventId: string) => {
    const contestEvent = contestEvents.find((el) => el.event.eventId === eventId);

    // Update the currently semi-final round
    if (contestEvent.rounds.length > 2) {
      const semiRound = contestEvent.rounds[contestEvent.rounds.length - 2];
      semiRound.roundTypeId = Object.values(RoundType)[contestEvent.rounds.length - 2];
    }

    // Update the currently last round
    const lastRound = contestEvent.rounds[contestEvent.rounds.length - 1];
    lastRound.proceed = {
      type: RoundProceed.Percentage,
      value: 50,
    };
    lastRound.roundTypeId = contestEvent.rounds.length > 1 ? RoundType.Semi : RoundType.First;

    // Add new round
    contestEvent.rounds.push(getNewRound(eventId, contestEvent.rounds.length + 1));

    setContestEvents(contestEvents.map((el) => (el.event.eventId === eventId ? contestEvent : el)));
  };

  const removeEventRound = (eventId: string) => {
    const contestEvent = contestEvents.find((el) => el.event.eventId === eventId);

    // Remove the schedule activity for that round
    for (const room of rooms) {
      const activityToDelete = room.activities.find(
        (el) => el.activityCode === contestEvent.rounds[contestEvent.rounds.length - 1].roundId,
      );

      if (activityToDelete) {
        deleteActivity(activityToDelete.id);
        break;
      }
    }

    contestEvent.rounds = contestEvent.rounds.slice(0, -1);

    // Update new final round
    const newLastRound = contestEvent.rounds[contestEvent.rounds.length - 1];
    delete newLastRound.proceed;
    newLastRound.roundTypeId = RoundType.Final;

    // Update new semi final round
    if (contestEvent.rounds.length > 2) {
      const newSemiRound = contestEvent.rounds[contestEvent.rounds.length - 2];
      newSemiRound.roundTypeId = RoundType.Semi;
    }

    setContestEvents(contestEvents.map((el) => (el.event.eventId === eventId ? contestEvent : el)));
  };

  const addContestEvent = () => {
    setContestEvents(
      [
        ...contestEvents,
        {
          event: events.find((el) => el.eventId === newEventId),
          rounds: [getNewRound(newEventId, 1)],
        },
      ].sort((a: IContestEvent, b: IContestEvent) => a.event.rank - b.event.rank),
    );

    if (remainingEvents.length > 1) {
      const newId = remainingEvents.find((event) => event.eventId !== newEventId)?.eventId;
      setNewEventId(newId);
    }
  };

  const removeContestEvent = (eventId: string) => {
    const newContestEvents: IContestEvent[] = [];

    for (const event of contestEvents) {
      if (event.event.eventId === eventId) {
        // Remove all schedule activities for that event
        for (const room of rooms) {
          for (const activity of room.activities) {
            if (event.rounds.some((r) => r.roundId === activity.activityCode)) {
              deleteActivity(activity.id);
            }
          }
        }
      } else {
        newContestEvents.push(event);
      }
    }

    setContestEvents(contestEvents.filter((el) => el.event.eventId !== eventId));
  };

  const addRoom = () => {
    setRoomName('');
    setRooms([
      ...rooms,
      {
        id: rooms.length === 0 ? 1 : rooms.reduce((prev, curr) => (curr.id > prev.id ? curr : prev)).id + 1,
        name: roomName.trim(),
        color: roomColor,
        activities: [],
      },
    ]);
  };

  const changeActivityStartTime = (newTimeZoned: Date) => {
    if (newTimeZoned) {
      const newTimeUTC = zonedTimeToUtc(newTimeZoned, venueTimezone);
      setActivityStartTime(newTimeUTC);

      // Change the activity end time too
      const activityLength = activityEndTime.getTime() - activityStartTime.getTime();
      setActivityEndTime(new Date(newTimeUTC.getTime() + activityLength));
    } else {
      setActivityStartTime(null);
    }
  };

  // Get the same date as the start time and use the new end time (the end time input is for time only)
  const changeActivityEndTime = (newTimeZoned: Date) => {
    if (newTimeZoned) {
      const zonedStartTime = utcToZonedTime(activityStartTime, venueTimezone);
      const newActivityEndTime = zonedTimeToUtc(
        parseISO(`${format(zonedStartTime, 'yyyy-MM-dd')}T${format(newTimeZoned, 'HH:mm:00')}`),
        venueTimezone,
      );
      setActivityEndTime(newActivityEndTime);
    } else {
      setActivityEndTime(null);
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
                // Gets the current highest ID + 1
                id:
                  room.activities.length === 0
                    ? 1
                    : room.activities.reduce((prev, curr) => (curr.id > prev.id ? curr : prev)).id + 1,
                activityCode,
                name: activityCode === 'other-misc' ? customActivity : undefined,
                startTime: activityStartTime,
                endTime: activityEndTime,
              },
            ],
          },
    );

    setRooms(newRooms);
    setActivityCode('');
    setCustomActivity('');
  };

  const deleteActivity = (activityId: number) => {
    setRooms((prevRooms) => {
      const newRooms = prevRooms.map((room) =>
        room.id !== selectedRoom
          ? room
          : {
              ...room,
              activities: room.activities.filter((a) => a.id !== activityId),
            },
      );
      console.log('New rooms:', newRooms);
      return newRooms;
    });
  };

  return (
    <div>
      <Form
        buttonText={mode === 'edit' ? 'Edit Contest' : 'Create Contest'}
        errorMessages={errorMessages}
        onSubmit={handleSubmit}
        disableButton={disableIfCompFinished || fetchTimezoneTimer !== null}
      >
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

        {activeTab === 'details' && (
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
              options={contestTypeOptions}
              selected={type}
              setSelected={changeType}
              disabled={mode !== 'new'}
            />
            {type !== ContestType.Online && (
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
                    <FormNumberInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val) => changeCoordinates(val, longitude)}
                      disabled={disableIfCompApprovedEvenForAdmin}
                      min={-90}
                      max={90}
                    />
                  </div>
                  <div className="col-3">
                    <FormNumberInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val) => changeCoordinates(latitude, val)}
                      disabled={disableIfCompApprovedEvenForAdmin}
                      min={-180}
                      max={180}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="mb-3 row">
              <div className="col">
                <label htmlFor="start_date" className="form-label">
                  {type === ContestType.Competition ? (
                    'Start date'
                  ) : (
                    <>
                      Start date and time
                      {type === ContestType.Online ? (
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
                  showTimeSelect={type !== ContestType.Competition}
                  timeFormat="p"
                  // P is date select only, Pp is date and time select
                  dateFormat={type === ContestType.Competition ? 'P' : 'Pp'}
                  locale="en-GB"
                  onChange={(date: Date) => changeStartDate(date)}
                  className="form-control"
                  disabled={disableIfCompApprovedEvenForAdmin}
                />
              </div>
              {type === ContestType.Competition && (
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
              title="Contact (optional)"
              placeholder="john@example.com"
              value={contact}
              setValue={setContact}
              disabled={disableIfCompFinished}
            />
            <FormTextArea
              title="Description (optional)"
              value={description}
              setValue={setDescription}
              disabled={disableIfCompFinished}
            />
            <FormNumberInput
              title={'Competitor limit' + (type !== ContestType.Competition ? ' (optional)' : '')}
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={disableIfCompApproved}
              integer
              min={C.minCompetitorLimit}
            />
          </>
        )}

        {activeTab === 'events' && (
          <>
            <div className="my-4 d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-success"
                onClick={addContestEvent}
                disabled={disableIfCompFinishedEvenForAdmin || contestEvents.length === filteredEvents.length}
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
            {contestEvents.map((ce, eventIndex) => (
              <div key={ce.event.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <EventTitle event={ce.event} fontSize="4" noMargin showIcon showDescription />

                  <button
                    type="button"
                    className="ms-3 btn btn-danger btn-sm"
                    onClick={() => removeContestEvent(ce.event.eventId)}
                    disabled={disableIfCompFinishedEvenForAdmin || ce.rounds.some((r) => r.results.length > 0)}
                  >
                    Remove Event
                  </button>
                </div>
                {ce.rounds.map((round, roundIndex) => (
                  <div key={round.roundId} className="mb-3 py-3 px-4 border rounded bg-body-secondary">
                    <div className="d-flex justify-content-between align-items-center gap-5 w-100">
                      <h5 className="m-0">{roundTypes[round.roundTypeId].label}</h5>
                      <div className="flex-grow-1">
                        <FormSelect
                          title=""
                          options={roundFormatOptions}
                          selected={round.format}
                          setSelected={(val: string) => changeRoundFormat(eventIndex, roundIndex, val as RoundFormat)}
                          disabled={disableIfCompFinishedEvenForAdmin || round.results.length > 0}
                          noMargin
                        />
                      </div>
                    </div>
                    {round.roundTypeId !== RoundType.Final && (
                      <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
                        <FormRadio
                          id={`${round.roundId}_proceed_type`}
                          title="Proceed to next round:"
                          options={roundProceedOptions}
                          selected={round.proceed.type}
                          setSelected={(val: any) => changeRoundProceed(eventIndex, roundIndex, val as RoundProceed)}
                          disabled={disableIfCompFinishedEvenForAdmin}
                          oneLine
                        />
                        <div style={{ width: '5rem' }}>
                          <FormNumberInput
                            id="round_proceed_value"
                            value={round.proceed.value}
                            setValue={(val) => changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)}
                            disabled={disableIfCompFinishedEvenForAdmin}
                            integer
                            min={round.proceed.type === RoundProceed.Percentage ? 1 : 2}
                            max={round.proceed.type === RoundProceed.Percentage ? 99 : Infinity}
                            noMargin
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="d-flex gap-3">
                  {ce.rounds.length < 10 && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => addRound(ce.event.eventId)}
                      disabled={disableIfCompFinishedEvenForAdmin}
                    >
                      Add Round {ce.rounds.length + 1}
                    </button>
                  )}
                  {ce.rounds.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeEventRound(ce.event.eventId)}
                      disabled={
                        disableIfCompFinishedEvenForAdmin ||
                        ce.rounds.find((r) => r.roundTypeId === RoundType.Final).results.length > 0
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

        {activeTab === 'schedule' && (
          <>
            <h3 className="mb-3">Rooms</h3>
            <div className="row">
              <div className="col-8">
                <FormTextInput
                  title="Room name"
                  value={roomName}
                  setValue={setRoomName}
                  disabled={disableIfCompFinished}
                />
              </div>
              <div className="col-4 d-flex justify-content-between align-items-end gap-3 mb-3">
                <div className="flex-grow-1">
                  <FormSelect
                    title="Color"
                    options={colorOptions}
                    selected={roomColor}
                    setSelected={setRoomColor}
                    disabled={disableIfCompFinished}
                    noMargin
                  />
                </div>
                <ColorSquare color={roomColor} />
              </div>
            </div>
            <button
              type="button"
              className="mt-3 mb-2 btn btn-success"
              disabled={disableIfCompFinished || !roomName.trim()}
              onClick={addRoom}
            >
              Create
            </button>
            <hr />
            <h3 className="mb-3">Schedule</h3>
            <div className="row">
              <div className="col">
                <FormSelect
                  title="Room"
                  options={roomOptions}
                  selected={selectedRoom}
                  setSelected={setSelectedRoom}
                  disabled={disableIfCompFinished || rooms.length === 0}
                />
              </div>
              <div className="col">
                <FormSelect
                  title="Activity"
                  options={activityOptions}
                  selected={activityCode}
                  setSelected={setActivityCode}
                  disabled={disableIfCompFinished || !selectedRoom}
                />
              </div>
            </div>
            {activityCode === 'other-misc' && (
              <FormTextInput
                title="Custom activity"
                value={customActivity}
                setValue={setCustomActivity}
                disabled={disableIfCompFinished}
              />
            )}
            <div className="mb-3 row">
              <div className="col">
                <label htmlFor="activity_start_time" className="form-label">
                  Start time ({venueTimezone})
                </label>
                <DatePicker
                  id="activity_start_time"
                  selected={activityStartTime && utcToZonedTime(activityStartTime, venueTimezone)}
                  showTimeSelect
                  timeIntervals={5}
                  timeFormat="p"
                  dateFormat="Pp"
                  locale="en-GB"
                  onChange={(date: Date) => changeActivityStartTime(date)}
                  disabled={disableIfCompFinished}
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
                  timeIntervals={5}
                  dateFormat="HH:mm"
                  onChange={(date: Date) => changeActivityEndTime(date)}
                  disabled={disableIfCompFinished}
                  className="form-control"
                />
              </div>
            </div>
            <button
              type="button"
              className="mt-3 mb-2 btn btn-success"
              disabled={disableIfCompFinished || !isValidActivity}
              onClick={addActivity}
            >
              Add to schedule
            </button>
          </>
        )}
      </Form>

      {activeTab === 'schedule' && (
        <Schedule
          rooms={rooms}
          contestEvents={contestEvents}
          timezone={venueTimezone}
          onDeleteActivity={disableIfCompFinished ? undefined : (id: number) => deleteActivity(id)}
        />
      )}
    </div>
  );
};

export default ContestForm;
