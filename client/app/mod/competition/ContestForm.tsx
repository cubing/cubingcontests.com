'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { addHours } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { useFetchWcaCompDetails, useLimitRequests, useMyFetch } from '~/helpers/customHooks';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormEventSelect from '@c/form/FormEventSelect';
import FormRadio from '@c/form/FormRadio';
import FormSelect from '@c/form/FormSelect';
import FormPersonInputs from '@c/form/FormPersonInputs';
import FormNumberInput from '@c/form/FormNumberInput';
import FormTextArea from '@c/form/FormTextArea';
import FormDatePicker from '@c/form/FormDatePicker';
import EventTitle from '@c/EventTitle';
import Tabs from '@c/UI/Tabs';
import Schedule from '@c/Schedule';
import ColorSquare from '@c/UI/ColorSquare';
import Loading from '@c/UI/Loading';
import Button from '@c/UI/Button';
import AttemptInput from '@c/AttemptInput';
import FormCheckbox from '@c/form/FormCheckbox';
import CreatorDetails from '@c/CreatorDetails';
import {
  IContestDto,
  ICompetitionDetails,
  IContestEvent,
  IEvent,
  IPerson,
  IRoom,
  IRound,
  IMeetupDetails,
  IAttempt,
  ICutoff,
  ITimeLimit,
  IContestData,
  IActivity,
} from '@sh/types';
import {
  Color,
  ContestState,
  ContestType,
  EventFormat,
  EventGroup,
  RoundFormat,
  RoundProceed,
  RoundType,
} from '@sh/enums';
import { getDateOnly, getIsCompType } from '@sh/sharedFunctions';
import {
  colorOptions,
  contestTypeOptions,
  cutoffAttemptsOptions,
  roundFormatOptions,
  roundProceedOptions,
} from '~/helpers/multipleChoiceOptions';
import { roundTypes } from '~/helpers/roundTypes';
import { getContestIdFromName, getUserInfo } from '~/helpers/utilityFunctions';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import C from '@sh/constants';
import { MainContext } from '~/helpers/contexts';

const isAdmin = getUserInfo()?.isAdmin;

const ContestForm = ({
  events,
  contestData: { contest, creator } = { contest: undefined, creator: undefined } as IContestData,
  mode,
}: {
  events: IEvent[];
  contestData?: IContestData;
  mode: 'new' | 'edit' | 'copy';
}) => {
  const myFetch = useMyFetch();
  const [limitTimezoneRequests, isLoadingTimezone] = useLimitRequests();
  const fetchWcaCompDetails = useFetchWcaCompDetails();
  const { changeErrorMessages, changeSuccessMessage, loadingId, changeLoadingId, resetMessagesAndLoadingId } =
    useContext(MainContext);

  const [activeTab, setActiveTab] = useState('details');
  const [detailsImported, setDetailsImported] = useState(mode === 'edit' && contest?.type === ContestType.WcaComp);
  const [queueEnabled, setQueueEnabled] = useState(false);

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [type, setType] = useState(ContestType.Meetup);
  const [city, setCity] = useState('');
  const [countryIso2, setCountryIso2] = useState('NOT_SELECTED');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0); // vertical coordinate (Y); ranges from -90 to 90
  const [longitude, setLongitude] = useState(0); // horizontal coordinate (X); ranges from -180 to 180
  const [startDate, setStartDate] = useState(getDateOnly(new Date()));
  // Meetup-only
  const [startTime, setStartTime] = useState(addHours(getDateOnly(new Date()), 12)); // use 12:00 as default start time
  const [endDate, setEndDate] = useState(new Date());
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState<number>(undefined);

  // Event stuff
  const [newEventId, setNewEventId] = useState(events[0].eventId);
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>([]);

  // Schedule stuff
  const [venueTimeZone, setVenueTimeZone] = useState('GMT'); // e.g. Europe/Berlin
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

  const totalRounds: number = useMemo(
    () => contestEvents.map((ce) => ce.rounds.length).reduce((prev, curr) => prev + curr, 0),
    [contestEvents],
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
      roomOptions.some((r) => r.value === selectedRoom),
    [activityCode, customActivity, roomOptions, selectedRoom],
  );

  const tabs = [
    { title: 'Details', value: 'details' },
    { title: 'Events', value: 'events' },
    { title: 'Schedule', value: 'schedule', hidden: !getIsCompType(type) },
  ];
  const filteredEvents = events.filter((ev) => type !== ContestType.WcaComp || !ev.groups.includes(EventGroup.WCA));
  const remainingEvents = filteredEvents.filter((ev) => !contestEvents.some((ce) => ce.event.eventId === ev.eventId));
  // Fix new event ID, if it's not in the list of remaining events
  if (!remainingEvents.some((e) => e.eventId === newEventId)) setNewEventId(remainingEvents[0].eventId);
  const disableIfCompApproved = !isAdmin && mode === 'edit' && contest.state >= ContestState.Approved;
  // This has been nominated for the best variable name award!
  const disableIfCompApprovedEvenForAdmin = mode === 'edit' && contest.state >= ContestState.Approved;
  const disableIfCompFinished = mode === 'edit' && contest.state >= ContestState.Finished;
  const disableIfCompPublished = mode === 'edit' && contest.state >= ContestState.Published;
  const disableIfDetailsImported = !isAdmin && detailsImported;

  //////////////////////////////////////////////////////////////////////////////
  // Use effect
  //////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (mode !== 'new') {
      setCompetitionId(contest.competitionId);
      setName(contest.name);
      setShortName(contest.shortName);
      setType(contest.type);
      if (contest.city) setCity(contest.city);
      setCountryIso2(contest.countryIso2);
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
      // Convert the dates from string to Date
      setStartDate(new Date(contest.startDate));

      if (!getIsCompType(contest.type)) {
        setStartTime(new Date(contest.meetupDetails.startTime));

        if (contest.type === ContestType.Meetup) setVenueTimeZone(contest.timezone);
      } else {
        setEndDate(new Date(contest.endDate));

        const setDefaultActivityTimes = (timezone: string) => {
          setActivityStartTime(fromZonedTime(addHours(new Date(contest.startDate), 12), timezone));
          setActivityEndTime(fromZonedTime(addHours(new Date(contest.startDate), 13), timezone));
        };

        if (contest.compDetails) {
          const venue = contest.compDetails.schedule.venues[0];
          setRooms(venue.rooms);
          setVenueTimeZone(venue.timezone);
          setDefaultActivityTimes(venue.timezone);
        } else {
          fetchTimeZone(contest.latitudeMicrodegrees / 1000000, contest.longitudeMicrodegrees / 1000000).then(
            (timeZone) => setDefaultActivityTimes(timeZone),
          );
        }
      }

      if (mode === 'copy') {
        const contestEventsWithoutRoundIdsOrResults = contest.events.map((ce) => ({
          ...ce,
          rounds: ce.rounds.map((r) => ({ ...r, _id: undefined, results: [] })),
        }));
        setContestEvents(contestEventsWithoutRoundIdsOrResults);
      } else if (mode === 'edit') {
        setContestEvents(contest.events);
        if (contest.queuePosition) setQueueEnabled(true);
      }
    }
  }, [contest, events]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (!startDate || (getIsCompType(type) && !endDate) || (!getIsCompType(type) && !startTime)) {
      changeErrorMessages(['Please enter valid dates']);
      return;
    }

    changeLoadingId('form_submit_button');

    const selectedOrganizers = organizers.filter((el) => el !== null);
    let latitudeMicrodegrees: number, longitudeMicrodegrees: number;
    if (typeof latitude === 'number') latitudeMicrodegrees = Math.round(latitude * 1000000);
    if (typeof longitude === 'number') longitudeMicrodegrees = Math.round(longitude * 1000000);

    // Set the competition ID for every round and empty results if there were any
    // in order to avoid sending too much data to the backend
    const processedCompEvents = contestEvents.map((ce) => ({
      ...ce,
      rounds: ce.rounds.map((round) => ({ ...round, competitionId, results: [] })),
    }));

    let compDetails: ICompetitionDetails; // this is left undefined if the type is not competition
    let meetupDetails: IMeetupDetails; // this is left undefined if the type is competition

    if (getIsCompType(type)) {
      compDetails = {
        schedule: {
          competitionId,
          venues: [
            {
              id: 1,
              name: venue || 'Unknown venue',
              countryIso2,
              latitudeMicrodegrees,
              longitudeMicrodegrees,
              timezone: 'TEMPORARY', // this is set on the backend
              // Only send the rooms that have at least one activity
              rooms: rooms.filter((el) => el.activities.length > 0),
            },
          ],
        },
      };
    } else {
      meetupDetails = { startTime };
    }

    const newComp: IContestDto = {
      competitionId,
      name: name.trim(),
      shortName: shortName.trim(),
      type,
      city: city.trim(),
      countryIso2,
      venue: venue.trim(),
      address: address.trim(),
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate,
      endDate: getIsCompType(type) ? endDate : undefined,
      organizers: selectedOrganizers,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit || undefined,
      events: processedCompEvents,
      compDetails,
      meetupDetails,
    };

    // Validation
    const tempErrors: string[] = [];

    if (selectedOrganizers.length < organizerNames.filter((el) => el !== '').length)
      tempErrors.push('Please enter all organizers');

    if (type === ContestType.WcaComp && !detailsImported)
      tempErrors.push('You must use the "Get WCA competition details" feature');

    if (tempErrors.length > 0) {
      changeErrorMessages(tempErrors);
    } else {
      const { errors } =
        mode === 'edit'
          ? await myFetch.patch(`/competitions/${contest.competitionId}`, newComp, { loadingId: null })
          : await myFetch.post('/competitions', newComp, { loadingId: null });

      if (errors) changeErrorMessages(errors);
      else window.location.href = '/mod';
    }
  };

  const fillWithMockData = () => {
    setName('New Competition 2024');
    setShortName('New Competition 2024');
    setCompetitionId('NewCompetition2024');
    setType(ContestType.Competition);
    setCity('Singapore');
    setCountryIso2('SG');
    setAddress('Address');
    setVenue('Venue');
    setLatitude(1.314663);
    setLongitude(103.845409);
    setVenueTimeZone('Asia/Singapore');
    addContestEvent();
    setCompetitorLimit(100);
    setRooms([{ id: 1, name: 'Main', color: Color.White, activities: [] }]);
  };

  const changeActiveTab = (newTab: string) => {
    if (newTab === 'schedule' && (typeof latitude !== 'number' || typeof longitude !== 'number')) {
      changeErrorMessages(['Please enter valid coordinates first']);
    } else {
      setActiveTab(newTab);

      if (newTab === 'events') {
        // If the rounds that are supposed to have time limits don't have them
        // (this can be true for old contests), set them to empty time limits
        setContestEvents(
          contestEvents.map((ce) => ({
            ...ce,
            rounds: ce.rounds.map((r) => ({
              ...r,
              timeLimit: r.timeLimit ?? getTimeLimit(ce.event.format),
            })),
          })),
        );
      } else if (newTab === 'schedule') {
        setActivityStartTime(fromZonedTime(addHours(new Date(startDate), 12), venueTimeZone));
        setActivityEndTime(fromZonedTime(addHours(new Date(startDate), 13), venueTimeZone));
      }
    }
  };

  const changeName = (value: string) => {
    // If not editing a competition, update Competition ID accordingly, unless it deviates from the name
    if (mode !== 'edit') {
      if (competitionId === getContestIdFromName(name)) setCompetitionId(getContestIdFromName(value));
      if (shortName === name && value.length <= 32) setShortName(value);
    }

    setName(value);
  };

  const changeShortName = (value: string) => {
    if (value.length <= 32) setShortName(value);
  };

  const getWcaCompDetails = async () => {
    if (!competitionId) {
      changeErrorMessages(['Please enter a competition ID']);
      return;
    }

    try {
      changeLoadingId('get_wca_comp_details_button');
      const newContest = await fetchWcaCompDetails(competitionId);

      const latitude = Number((newContest.latitudeMicrodegrees / 1000000).toFixed(6));
      const longitude = Number((newContest.longitudeMicrodegrees / 1000000).toFixed(6));

      setName(newContest.name);
      setShortName(newContest.shortName);
      setCity(newContest.city);
      setCountryIso2(newContest.countryIso2);
      setAddress(newContest.address);
      setVenue(newContest.venue);
      setLatitude(latitude);
      setLongitude(longitude);
      setStartDate(newContest.startDate);
      setEndDate(newContest.endDate);
      setOrganizers([...newContest.organizers, null]);
      setOrganizerNames([...newContest.organizers.map((o) => o.name), '']);
      setDescription(newContest.description);
      setCompetitorLimit(newContest.competitorLimit);

      await changeCoordinates(latitude, longitude, newContest.startDate);

      setDetailsImported(true);
      resetMessagesAndLoadingId();
    } catch (err: any) {
      if (err.message.includes('Not found')) changeErrorMessages([`Competition with ID ${competitionId} not found`]);
      else changeErrorMessages([err.message]);
    }
  };

  const fetchTimeZone = async (lat: number, long: number): Promise<string> => {
    const { errors, payload } = await myFetch.get(`/timezone?latitude=${lat}&longitude=${long}`, {
      authorize: true,
      loadingId: null,
    });

    if (errors) {
      changeErrorMessages(errors);
      Promise.reject();
    } else {
      setVenueTimeZone(payload.timezone);
      return payload.timezone;
    }
  };

  const changeCoordinates = async (newLat: number, newLong: number, newActivityTimesDate?: Date) => {
    if ([null, undefined].includes(newLat) || [null, undefined].includes(newLong)) {
      setLatitude(newLat);
      setLongitude(newLong);
    } else {
      const processedLatitude = Math.min(Math.max(newLat, -90), 90);
      const processedLongitude = Math.min(Math.max(newLong, -180), 180);

      setLatitude(processedLatitude);
      setLongitude(processedLongitude);

      limitTimezoneRequests(async () => {
        // Adjust all times to the new time zone
        const timeZone: string = await fetchTimeZone(processedLatitude, processedLongitude);

        const start = newActivityTimesDate ? addHours(new Date(newActivityTimesDate), 12) : activityStartTime;
        setActivityStartTime(fromZonedTime(toZonedTime(start, venueTimeZone), timeZone));
        const end = newActivityTimesDate ? addHours(new Date(newActivityTimesDate), 13) : activityEndTime;
        setActivityEndTime(fromZonedTime(toZonedTime(end, venueTimeZone), timeZone));

        if (type === ContestType.Meetup) {
          setStartTime(fromZonedTime(toZonedTime(startTime, venueTimeZone), timeZone));
        } else if (getIsCompType(type)) {
          setRooms(
            rooms.map((r) => ({
              ...r,
              activities: r.activities.map((a) => ({
                ...a,
                startTime: fromZonedTime(toZonedTime(a.startTime, venueTimeZone), timeZone),
                endTime: fromZonedTime(toZonedTime(a.endTime, venueTimeZone), timeZone),
              })),
            })),
          );
        }
      });
    }
  };

  const changeStartDate = (newDate: Date) => {
    if (!getIsCompType(type)) {
      setStartTime(newDate);
      setStartDate(getDateOnly(toZonedTime(newDate, venueTimeZone)));
    } else {
      setStartDate(newDate);

      if (newDate.getTime() > endDate.getTime()) setEndDate(newDate);
    }
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundTimeLimit = (eventIndex: number, roundIndex: number, value: IAttempt) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : {
                    ...round,
                    timeLimit: { ...round.timeLimit, centiseconds: value.result },
                  },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  const changeRoundTimeLimitCumulative = (eventIndex: number, roundIndex: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : {
                    ...round,
                    timeLimit: {
                      ...round.timeLimit,
                      cumulativeRoundIds: round.timeLimit.cumulativeRoundIds.length > 0 ? [] : [round.roundId],
                    },
                  },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  const changeRoundCutoffEnabled = (eventIndex: number, roundIndex: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : {
                    ...round,
                    cutoff: round.cutoff
                      ? undefined
                      : { attemptResult: 12000, numberOfAttempts: round.format === RoundFormat.Average ? 2 : 1 },
                  },
            ),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundCutoff = (eventIndex: number, roundIndex: number, value: ICutoff) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, cutoff: value })),
          },
    );
    setContestEvents(newContestEvents);
  };

  const changeRoundProceed = (eventIndex: number, roundIndex: number, type: RoundProceed, newVal?: number) => {
    const newContestEvents = contestEvents.map((ce, i) =>
      i !== eventIndex
        ? ce
        : {
            ...ce,
            rounds: ce.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : { ...round, proceed: { type, value: newVal === undefined ? round.proceed.value : newVal } },
            ),
          },
    );

    setContestEvents(newContestEvents);
  };

  const getTimeLimit = (eventFormat: EventFormat): ITimeLimit =>
    eventFormat === EventFormat.Time ? { centiseconds: 60000, cumulativeRoundIds: [] } : undefined;

  const getNewRound = (event: IEvent, roundNumber: number): IRound => {
    return {
      roundId: `${event.eventId}-r${roundNumber}`,
      competitionId: 'temp', // this gets replaced for all rounds on submit
      roundTypeId: RoundType.Final,
      format: events.find((el) => el.eventId === event.eventId).defaultRoundFormat,
      timeLimit: getTimeLimit(event.format),
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
    contestEvent.rounds.push(getNewRound(contestEvent.event, contestEvent.rounds.length + 1));

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
        deleteActivity(room.id, activityToDelete.id);
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
    const contestEvent = events.find((el) => el.eventId === newEventId);

    setContestEvents(
      [...contestEvents, { event: contestEvent, rounds: [getNewRound(contestEvent, 1)] }].sort(
        (a: IContestEvent, b: IContestEvent) => a.event.rank - b.event.rank,
      ),
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
              deleteActivity(room.id, activity.id);
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

  const changeActivityStartTime = (newTime: Date) => {
    setActivityStartTime(newTime);

    if (newTime) {
      // Change the activity end time too
      const activityLength = activityEndTime.getTime() - activityStartTime.getTime();
      setActivityEndTime(new Date(newTime.getTime() + activityLength));
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
                childActivities: [],
              },
            ],
          },
    );

    setRooms(newRooms);
    setActivityCode('');
    setCustomActivity('');
  };

  // Simply deletes the activity and copies the values to the inputs
  const editActivity = (roomId: number, activity: IActivity) => {
    deleteActivity(roomId, activity.id);
    setActivityCode(activity.activityCode);
    setActivityStartTime(activity.startTime);
    setActivityEndTime(activity.endTime);
    setCustomActivity(activity.name ?? '');
  };

  const deleteActivity = (roomId: number, activityId: number) => {
    setRooms(
      rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              activities: room.activities.filter((a) => a.id !== activityId),
            },
      ),
    );
  };

  const cloneContest = () => {
    changeLoadingId('clone_contest_button');
    window.location.href = `/mod/competition?copy_id=${contest.competitionId}`;
  };

  const removeContest = async () => {
    const answer = confirm(`Are you sure you would like to remove ${contest.name}?`);

    if (answer) {
      const { errors } = await myFetch.delete(`/competitions/${competitionId}`, {
        loadingId: 'delete_contest_button',
        keepLoadingAfterSuccess: true,
      });

      if (!errors) window.location.href = '/mod';
    }
  };

  const downloadScorecards = async () => {
    await myFetch.get(`/scorecards/${contest.competitionId}`, {
      authorize: true,
      fileName: `${contest.competitionId}_Scorecards.pdf`,
      loadingId: 'download_scorecards_button',
    });
  };

  const enableQueue = async () => {
    const { errors } = await myFetch.patch(
      `/competitions/enable-queue/${contest.competitionId}`,
      {},
      { loadingId: 'enable_queue_button' },
    );

    if (!errors) setQueueEnabled(true);
  };

  const createAuthToken = async () => {
    const { payload, errors } = await myFetch.get(`/create-auth-token/${contest.competitionId}`, {
      authorize: true,
      loadingId: 'get_access_token_button',
    });

    if (!errors) changeSuccessMessage(`Your new access token is ${payload}`);
  };

  return (
    <div>
      <Form
        buttonText={mode === 'edit' ? 'Edit Contest' : 'Create Contest'}
        onSubmit={handleSubmit}
        disableButton={disableIfCompFinished}
      >
        {isAdmin && mode === 'edit' && <CreatorDetails creator={creator} />}

        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

        {activeTab === 'details' && (
          <>
            {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && mode === 'new' && (
              <Button text="Fill with mock data" onClick={fillWithMockData} className="btn-secondary my-3" />
            )}
            {mode === 'edit' && (
              <div className="d-flex flex-wrap gap-3 mt-3 mb-4">
                {contest.type !== ContestType.WcaComp && (
                  // This has to be done like this, because redirection using <Link/> breaks the clone contest feature
                  <Button id="clone_contest_button" text="Clone" onClick={cloneContest} loadingId={loadingId} />
                )}
                {isAdmin && (
                  <Button
                    id="delete_contest_button"
                    text="Remove Contest"
                    onClick={removeContest}
                    loadingId={loadingId}
                    disabled={contest.participants > 0}
                    className="btn-danger"
                  />
                )}
                <Button
                  id="download_scorecards_button"
                  text="Scorecards"
                  onClick={downloadScorecards}
                  loadingId={loadingId}
                  disabled={contest.state < ContestState.Approved}
                  className="btn-success"
                />
                <Button
                  id="enable_queue_button"
                  text={queueEnabled ? 'Queue Enabled' : 'Enable Queue'}
                  onClick={enableQueue}
                  loadingId={loadingId}
                  disabled={
                    contest.state < ContestState.Approved || contest.state >= ContestState.Finished || queueEnabled
                  }
                  className="btn-secondary"
                />
                <Button
                  id="get_access_token_button"
                  text="Get Access Token"
                  onClick={createAuthToken}
                  loadingId={loadingId}
                  disabled={contest.state < ContestState.Approved || contest.state >= ContestState.Finished}
                  className="btn-secondary"
                />
              </div>
            )}
            <FormTextInput
              title="Contest name"
              value={name}
              setValue={changeName}
              autoFocus
              disabled={disableIfCompApproved || disableIfDetailsImported}
            />
            <FormTextInput
              title="Short name"
              value={shortName}
              setValue={changeShortName}
              disabled={disableIfCompApproved || disableIfDetailsImported}
            />
            <FormTextInput
              title="Contest ID"
              value={competitionId}
              setValue={setCompetitionId}
              disabled={mode === 'edit' || disableIfDetailsImported}
            />
            <FormRadio
              title="Type"
              options={contestTypeOptions.filter((ct) => !ct.disabled)}
              selected={type}
              setSelected={setType}
              disabled={mode !== 'new' || disableIfDetailsImported}
            />
            {type === ContestType.WcaComp && (mode === 'new' || isAdmin) && (
              <Button
                id="get_wca_comp_details_button"
                text="Get WCA competition details"
                onClick={getWcaCompDetails}
                loadingId={loadingId}
                className="mb-3"
                disabled={disableIfDetailsImported}
              />
            )}
            <div className="row">
              <div className="col">
                <FormTextInput
                  title="City"
                  value={city}
                  setValue={setCity}
                  disabled={disableIfCompApproved || disableIfDetailsImported}
                />
              </div>
              <div className="col">
                <FormCountrySelect
                  countryIso2={countryIso2}
                  setCountryIso2={setCountryIso2}
                  disabled={mode === 'edit' || disableIfDetailsImported}
                />
              </div>
            </div>
            <FormTextInput title="Address" value={address} setValue={setAddress} disabled={disableIfCompApproved} />
            <div className="row">
              <div className="col-12 col-md-6">
                <FormTextInput title="Venue" value={venue} setValue={setVenue} disabled={disableIfCompApproved} />
              </div>
              <div className="col-12 col-md-6">
                <div className="row">
                  <div className="col-6">
                    <FormNumberInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val) => changeCoordinates(val, longitude)}
                      disabled={disableIfCompApprovedEvenForAdmin || disableIfDetailsImported}
                      min={-90}
                      max={90}
                    />
                  </div>
                  <div className="col-6">
                    <FormNumberInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val) => changeCoordinates(latitude, val)}
                      disabled={disableIfCompApprovedEvenForAdmin || disableIfDetailsImported}
                      min={-180}
                      max={180}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="text-secondary fs-6">
                    Time zone: {isLoadingTimezone ? <Loading small dontCenter /> : venueTimeZone}
                  </div>
                </div>
              </div>
            </div>
            <div className="my-3 row">
              <div className="col">
                {!getIsCompType(type) ? (
                  <FormDatePicker
                    id="start_date"
                    title={`Start date and time (${
                      type === ContestType.Meetup ? (isLoadingTimezone ? '...' : venueTimeZone) : 'UTC'
                    })`}
                    value={startTime}
                    setValue={changeStartDate}
                    timeZone={type === ContestType.Meetup ? venueTimeZone : 'UTC'}
                    dateFormat="Pp"
                    disabled={disableIfCompApprovedEvenForAdmin || disableIfDetailsImported}
                    showUTCTime
                  />
                ) : (
                  <FormDatePicker
                    id="start_date"
                    title="Start date"
                    value={startDate}
                    setValue={changeStartDate}
                    dateFormat="P"
                    disabled={disableIfCompApprovedEvenForAdmin || disableIfDetailsImported}
                  />
                )}
              </div>
              {getIsCompType(type) && (
                <div className="col">
                  <FormDatePicker
                    id="end_date"
                    title="End date"
                    value={endDate}
                    setValue={setEndDate}
                    disabled={disableIfCompApprovedEvenForAdmin || disableIfDetailsImported}
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
                infiniteInputs
                nextFocusTargetId="contact"
                disabled={disableIfCompApproved}
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
              title={'Competitor limit' + (!getIsCompType(type) ? ' (optional)' : '')}
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={disableIfCompApproved || disableIfDetailsImported}
              integer
              min={C.minCompetitorLimit}
            />
          </>
        )}

        {activeTab === 'events' && (
          <>
            <p className="my-4">
              Total events: {contestEvents.length} | Total rounds: {totalRounds}
            </p>
            <div className="my-4 d-flex align-items-center gap-3">
              <Button
                text="Add Event"
                onClick={addContestEvent}
                disabled={
                  disableIfCompApproved || disableIfCompPublished || contestEvents.length === filteredEvents.length
                }
                className="btn btn-success"
              />
              <div className="flex-grow-1">
                <FormEventSelect
                  title=""
                  noMargin
                  events={remainingEvents}
                  eventId={newEventId}
                  setEventId={setNewEventId}
                  disabled={disableIfCompPublished}
                />
              </div>
            </div>
            {contestEvents.map((ce, eventIndex) => (
              <div key={ce.event.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                  <EventTitle event={ce.event} fontSize="4" noMargin showIcon showDescription />

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeContestEvent(ce.event.eventId)}
                    disabled={disableIfCompPublished || ce.rounds.some((r) => r.results.length > 0)}
                  >
                    Remove Event
                  </button>
                </div>
                {ce.rounds.map((round, roundIndex) => (
                  <div key={round.roundId} className="mb-3 py-3 px-3 px-md-4 border rounded bg-body-secondary">
                    <div className="flex-grow-1 d-flex align-items-center gap-3 gap-md-5">
                      <h5 className="m-0">{roundTypes[round.roundTypeId].label}</h5>

                      <div className="flex-grow-1">
                        <FormSelect
                          title=""
                          options={roundFormatOptions}
                          selected={round.format}
                          setSelected={(val: string) => changeRoundFormat(eventIndex, roundIndex, val as RoundFormat)}
                          disabled={disableIfCompPublished || round.results.length > 0}
                          noMargin
                        />
                      </div>
                    </div>
                    {ce.event.format === EventFormat.Time && (
                      <div className="d-flex flex-wrap align-items-center gap-3 gap-md-5 w-100 mt-3">
                        <div className="d-flex justify-content-between align-items-center gap-3">
                          <h6 className="flex-shrink-0 m-0">Time limit:</h6>

                          <div style={{ maxWidth: '8rem' }}>
                            <AttemptInput
                              attNumber={0}
                              attempt={{ result: round.timeLimit.centiseconds }}
                              setAttempt={(val) => changeRoundTimeLimit(eventIndex, roundIndex, val)}
                              event={ce.event}
                              maxTime={C.maxTimeLimit}
                              disabled={disableIfCompPublished || round.results.length > 0}
                            />
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center gap-3">
                          <h6 className="flex-shrink-0 m-0">Cumulative limit:</h6>

                          <FormCheckbox
                            title=""
                            id={`cumulative_limit_${ce.event.eventId}_${roundIndex + 1}`}
                            selected={round.timeLimit.cumulativeRoundIds.length > 0}
                            setSelected={() => changeRoundTimeLimitCumulative(eventIndex, roundIndex)}
                            disabled={disableIfCompPublished || round.results.length > 0}
                            noMargin
                          />
                        </div>
                      </div>
                    )}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 gap-md-5 mt-3">
                      <h6 className="flex-shrink-0 m-0">Cutoff:</h6>

                      <FormCheckbox
                        title="Enabled"
                        id={`cutoff_${ce.event.eventId}_${roundIndex + 1}`}
                        selected={round.cutoff !== undefined}
                        setSelected={() => changeRoundCutoffEnabled(eventIndex, roundIndex)}
                        disabled={disableIfCompPublished || round.results.length > 0}
                        noMargin
                        small
                      />

                      <div style={{ maxWidth: '8rem' }}>
                        <AttemptInput
                          attNumber={0}
                          attempt={{
                            result: round.cutoff?.attemptResult === undefined ? 0 : round.cutoff.attemptResult,
                          }}
                          setAttempt={(val: IAttempt) =>
                            changeRoundCutoff(eventIndex, roundIndex, { ...round.cutoff, attemptResult: val.result })
                          }
                          event={ce.event}
                          maxTime={C.maxTimeLimit}
                          disabled={disableIfCompPublished || !round.cutoff || round.results.length > 0}
                        />
                      </div>

                      <div className="d-flex justify-content-between align-items-center gap-3">
                        <h6 className="m-0">Attempts:</h6>

                        <FormSelect
                          title=""
                          options={cutoffAttemptsOptions}
                          selected={round.cutoff?.numberOfAttempts || 2}
                          setSelected={(val: number) =>
                            changeRoundCutoff(eventIndex, roundIndex, { ...round.cutoff, numberOfAttempts: val })
                          }
                          disabled={disableIfCompPublished || !round.cutoff || round.results.length > 0}
                          noMargin
                        />
                      </div>
                    </div>
                    {round.roundTypeId !== RoundType.Final && (
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
                        <FormRadio
                          id={`${round.roundId}_proceed_type`}
                          title="Proceed to next round:"
                          options={roundProceedOptions}
                          selected={round.proceed.type}
                          setSelected={(val: any) => changeRoundProceed(eventIndex, roundIndex, val as RoundProceed)}
                          disabled={disableIfCompPublished}
                          oneLine
                          small
                        />
                        <div style={{ width: '5rem' }}>
                          <FormNumberInput
                            id="round_proceed_value"
                            value={round.proceed.value}
                            setValue={(val) => changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)}
                            disabled={disableIfCompPublished}
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
                    <Button
                      text={`Add Round ${ce.rounds.length + 1}`}
                      className="btn-success btn-sm"
                      onClick={() => addRound(ce.event.eventId)}
                      disabled={mode === 'edit'} // TEMPORARY
                    />
                  )}
                  {ce.rounds.length > 1 && (
                    <Button
                      text="Remove Round"
                      onClick={() => removeEventRound(ce.event.eventId)}
                      disabled={
                        disableIfCompPublished ||
                        ce.rounds.find((r) => r.roundTypeId === RoundType.Final).results.length > 0
                      }
                      className="btn-danger btn-sm"
                    />
                  )}
                </div>
              </div>
            ))}
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
            <div className="mb-3 row align-items-end">
              <div className="col">
                <FormDatePicker
                  id="activity_start_time"
                  title={`Start time (${venueTimeZone})`}
                  value={activityStartTime}
                  setValue={changeActivityStartTime}
                  timeZone={venueTimeZone}
                  dateFormat="Pp"
                  timeIntervals={5}
                  disabled={disableIfCompFinished}
                  showUTCTime
                />
              </div>
              <div className="col">
                <FormDatePicker
                  id="activity_end_time"
                  value={activityEndTime}
                  setValue={setActivityEndTime}
                  timeZone={venueTimeZone}
                  dateFormat="Pp"
                  timeIntervals={5}
                  disabled={disableIfCompFinished}
                  showUTCTime
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
          timeZone={venueTimeZone}
          onEditActivity={disableIfCompFinished ? undefined : editActivity}
          onDeleteActivity={disableIfCompFinished ? undefined : deleteActivity}
        />
      )}
    </div>
  );
};

export default ContestForm;
