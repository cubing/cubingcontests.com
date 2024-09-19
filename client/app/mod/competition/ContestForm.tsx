'use client';

import { useContext, useEffect, useState } from 'react';
import { addHours } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { useFetchWcaCompDetails, useLimitRequests, useMyFetch } from '~/helpers/customHooks';
import {
  IContestDto,
  ICompetitionDetails,
  IContestEvent,
  IEvent,
  IPerson,
  IRoom,
  IMeetupDetails,
  IContestData,
  IFePerson,
  NumberInputValue,
} from '@sh/types';
import { Color, ContestState, ContestType } from '@sh/enums';
import { getDateOnly, getIsCompType } from '@sh/sharedFunctions';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';
import { getContestIdFromName, getTimeLimit, getUserInfo } from '~/helpers/utilityFunctions';
import C from '@sh/constants';
import { MainContext } from '~/helpers/contexts';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import FormCountrySelect from '@c/form/FormCountrySelect';
import FormRadio from '@c/form/FormRadio';
import FormPersonInputs from '@c/form/FormPersonInputs';
import FormNumberInput from '@c/form/FormNumberInput';
import FormTextArea from '@c/form/FormTextArea';
import FormDatePicker from '@c/form/FormDatePicker';
import Tabs from '@c/UI/Tabs';
import Loading from '@c/UI/Loading';
import Button from '@c/UI/Button';
import CreatorDetails from '@c/CreatorDetails';
import ContestEvents from './ContestEvents';
import ScheduleEditor from './ScheduleEditor';

const userInfo = getUserInfo();

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
  const [startTime, setStartTime] = useState(addHours(getDateOnly(new Date()), 12)); // meetup-only; set 12:00 as initial start time
  const [endDate, setEndDate] = useState(new Date());
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState<NumberInputValue>();

  // Event stuff
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>([]);

  // Schedule stuff
  const [venueTimeZone, setVenueTimeZone] = useState('GMT'); // e.g. Europe/Berlin
  const [rooms, setRooms] = useState<IRoom[]>([]);

  //////////////////////////////////////////////////////////////////////////////
  // Use memo
  //////////////////////////////////////////////////////////////////////////////

  const tabs = [
    { title: 'Details', value: 'details' },
    { title: 'Events', value: 'events' },
    { title: 'Schedule', value: 'schedule', hidden: !getIsCompType(type) },
  ];
  const disableIfContestApproved = mode === 'edit' && contest.state >= ContestState.Approved;
  const disableIfContestPublished = mode === 'edit' && contest.state >= ContestState.Published;
  const disableIfDetailsImported = !userInfo.isAdmin && detailsImported;

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

      if (getIsCompType(contest.type)) {
        setEndDate(new Date(contest.endDate));

        if (contest.compDetails) {
          const venue = contest.compDetails.schedule.venues[0];
          setRooms(venue.rooms);
          setVenueTimeZone(venue.timezone);
          // This was necessary for imported comps in the past, because they had compDetails as undefined immediately after import.
          // Commenting this out, cause the import feature is currently disabled. Feel free to remove this in the future if it's no
          // longer needed for importing comps.
          // } else {
          //   fetchTimeZone(contest.latitudeMicrodegrees / 1000000, contest.longitudeMicrodegrees / 1000000).then((tz) => setDefaultActivityTimes(tz));
        }
      } else {
        setStartTime(new Date(contest.meetupDetails.startTime));
        setVenueTimeZone(contest.timezone);
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

    // Set the contest ID for every round and empty results if there were any
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

  const fillWithMockData = async (mockContestType = ContestType.Competition) => {
    const { payload, errors } = await myFetch.get<IFePerson>(`/persons?personId=${userInfo.personId}`, {
      loadingId: 'set_mock_comp_button',
    });

    if (!errors) {
      setType(mockContestType);
      setCity('Singapore');
      setCountryIso2('SG');
      setAddress('Address');
      setVenue('Venue');
      setLatitude(1.314663);
      setLongitude(103.845409);
      setOrganizerNames([payload.name]);
      setOrganizers([payload]);
      setContact(`${userInfo.username}@cc.com`);
      setDescription('THIS IS A MOCK CONTEST!');
      setCompetitorLimit(100);

      if (mockContestType === ContestType.Meetup) {
        setName('New Meetup 2024');
        setShortName('New Meetup 2024');
        setCompetitionId('NewMeetup2024');
      } else {
        setName('New Competition 2024');
        setShortName('New Competition 2024');
        setCompetitionId('NewCompetition2024');
        setVenueTimeZone('Asia/Singapore');
        setRooms([{ id: 1, name: 'Main', color: Color.White, activities: [] }]);
      }
    }
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
    // Only update the value if the new one is within the allowed limit, or if it's shorter than it was (e.g. when Backspace is pressed)
    if (value.length <= 32 || value.length < shortName.length) setShortName(value);
  };

  const getWcaCompDetails = async () => {
    if (!competitionId) {
      changeErrorMessages(['Please enter a contest ID']);
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

      await changeCoordinates(latitude, longitude);

      setDetailsImported(true);
      resetMessagesAndLoadingId();
    } catch (err: any) {
      if (err.message.includes('Not found'))
        changeErrorMessages([
          `Competition with ID ${competitionId} not found. This may be because it's not been enough time since it was announced. If so, please try again in 24 hours.`,
        ]);
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

  const changeCoordinates = async (newLat: number, newLong: number) => {
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
        disableButton={disableIfContestPublished}
      >
        {userInfo.isAdmin && mode === 'edit' && <CreatorDetails creator={creator} />}

        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

        {activeTab === 'details' && (
          <>
            {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && mode === 'new' && (
              <div className="d-flex gap-3 mt-3 mb-4">
                <Button
                  id="set_mock_comp_button"
                  onClick={() => fillWithMockData()}
                  disabled={detailsImported}
                  className="btn-secondary"
                >
                  Set Mock Competition
                </Button>
                <Button
                  onClick={() => fillWithMockData(ContestType.Meetup)}
                  disabled={detailsImported}
                  className="btn-secondary"
                >
                  Set Mock Meetup
                </Button>
              </div>
            )}
            {mode === 'edit' && (
              <div className="d-flex flex-wrap gap-3 mt-3 mb-4">
                {contest.type !== ContestType.WcaComp && (
                  // This has to be done like this, because redirection using <Link/> breaks the clone contest feature
                  <Button id="clone_contest_button" onClick={cloneContest} loadingId={loadingId}>
                    Clone
                  </Button>
                )}
                {userInfo.isAdmin && (
                  <Button
                    id="delete_contest_button"
                    onClick={removeContest}
                    loadingId={loadingId}
                    disabled={contest.participants > 0}
                    className="btn-danger"
                  >
                    Remove Contest
                  </Button>
                )}
                <Button
                  id="download_scorecards_button"
                  onClick={downloadScorecards}
                  loadingId={loadingId}
                  disabled={contest.state < ContestState.Approved}
                  className="btn-success"
                >
                  Scorecards
                </Button>
                <Button
                  id="enable_queue_button"
                  onClick={enableQueue}
                  loadingId={loadingId}
                  disabled={
                    contest.state < ContestState.Approved || contest.state >= ContestState.Finished || queueEnabled
                  }
                  className="btn-secondary"
                >
                  {queueEnabled ? 'Queue Enabled' : 'Enable Queue'}
                </Button>
                <Button
                  id="get_access_token_button"
                  onClick={createAuthToken}
                  loadingId={loadingId}
                  disabled={contest.state < ContestState.Approved || contest.state >= ContestState.Finished}
                  className="btn-secondary"
                >
                  Get Access Token
                </Button>
              </div>
            )}
            <FormTextInput
              title="Contest name"
              value={name}
              setValue={changeName}
              autoFocus
              disabled={disableIfDetailsImported}
            />
            <FormTextInput
              title="Short name"
              value={shortName}
              setValue={changeShortName}
              disabled={disableIfDetailsImported}
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
            {type === ContestType.WcaComp && mode === 'new' && (
              <Button
                id="get_wca_comp_details_button"
                onClick={getWcaCompDetails}
                loadingId={loadingId}
                className="mb-3"
                disabled={disableIfDetailsImported}
              >
                Get WCA competition details
              </Button>
            )}
            <div className="row">
              <div className="col">
                <FormTextInput title="City" value={city} setValue={setCity} disabled={disableIfDetailsImported} />
              </div>
              <div className="col">
                <FormCountrySelect
                  countryIso2={countryIso2}
                  setCountryIso2={setCountryIso2}
                  disabled={mode === 'edit' || disableIfDetailsImported}
                />
              </div>
            </div>
            <FormTextInput title="Address" value={address} setValue={setAddress} disabled={disableIfDetailsImported} />
            <div className="row">
              <div className="col-12 col-md-6">
                <FormTextInput title="Venue" value={venue} setValue={setVenue} disabled={disableIfDetailsImported} />
              </div>
              <div className="col-12 col-md-6">
                <div className="row">
                  <div className="col-6">
                    <FormNumberInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val) => changeCoordinates(val, longitude)}
                      disabled={disableIfContestApproved || disableIfDetailsImported}
                      min={-90}
                      max={90}
                    />
                  </div>
                  <div className="col-6">
                    <FormNumberInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val) => changeCoordinates(latitude, val)}
                      disabled={disableIfContestApproved || disableIfDetailsImported}
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
                    disabled={disableIfContestApproved || disableIfDetailsImported}
                    showUTCTime
                  />
                ) : (
                  <FormDatePicker
                    id="start_date"
                    title="Start date"
                    value={startDate}
                    setValue={changeStartDate}
                    dateFormat="P"
                    disabled={disableIfContestApproved || disableIfDetailsImported}
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
                    disabled={disableIfContestApproved || disableIfDetailsImported}
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
                disabled={disableIfContestApproved && !userInfo.isAdmin}
                addNewPersonFromNewTab
              />
            </div>
            <FormTextInput
              id="contact"
              title="Contact (optional)"
              placeholder="john@example.com"
              value={contact}
              setValue={setContact}
              disabled={disableIfContestPublished}
            />
            <FormTextArea
              title="Description (optional)"
              value={description}
              setValue={setDescription}
              disabled={disableIfContestPublished}
            />
            <FormNumberInput
              title={'Competitor limit' + (!getIsCompType(type) ? ' (optional)' : '')}
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={(disableIfContestApproved && !userInfo.isAdmin) || disableIfDetailsImported}
              integer
              min={C.minCompetitorLimit}
            />
          </>
        )}

        {activeTab === 'events' && (
          <ContestEvents
            events={events}
            contestEvents={contestEvents}
            setContestEvents={setContestEvents}
            contestType={type}
            disableNewEvents={!userInfo.isAdmin && disableIfContestApproved && type !== ContestType.Meetup}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleEditor
            rooms={rooms}
            setRooms={setRooms}
            venueTimeZone={venueTimeZone}
            startDate={startDate}
            contestEvents={contestEvents}
            disabled={disableIfContestPublished}
          />
        )}
      </Form>
    </div>
  );
};

export default ContestForm;
