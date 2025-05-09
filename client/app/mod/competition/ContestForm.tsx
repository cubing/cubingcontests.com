"use client";

import { useCallback, useContext, useState, useTransition } from "react";
import { addHours } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { debounce } from "lodash";
import { useFetchWcaCompDetails, useMyFetch } from "~/helpers/customHooks.ts";
import {
  type Event,
  type ICompetitionDetails,
  type IContest,
  type IContestDto,
  type IContestEvent,
  type IFePerson,
  type IFeUser,
  type IMeetupDetails,
  type IRoom,
  type IRound,
  type NumberInputValue,
  type PageSize,
} from "~/helpers/types.ts";
import { Color, ContestState, ContestType } from "~/helpers/enums.ts";
import { getDateOnly, getIsCompType } from "~/helpers/sharedFunctions.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import {
  getContestIdFromName,
  getTimeLimit,
  getUserInfo,
} from "~/helpers/utilityFunctions.ts";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import Form from "~/app/components/form/Form.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import FormCountrySelect from "~/app/components/form/FormCountrySelect.tsx";
import FormRadio from "~/app/components/form/FormRadio.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormTextArea from "~/app/components/form/FormTextArea.tsx";
import FormDatePicker from "~/app/components/form/FormDatePicker.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Button from "~/app/components/UI/Button.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import ContestEvents from "./ContestEvents.tsx";
import ScheduleEditor from "./ScheduleEditor.tsx";
import WcaCompAdditionalDetails from "~/app/components/WcaCompAdditionalDetails.tsx";
import type { InputPerson } from "~/helpers/types.ts";
import Tooltip from "~/app/components/UI/Tooltip.tsx";
import { getTimeZoneFromCoords } from "~/server/serverFunctions.ts";
import { CoordinatesValidator } from "~/helpers/validators/coordinates.ts";

const userInfo = getUserInfo();

const ContestForm = ({
  events,
  mode,
  contest,
  creator,
}: {
  events: Event[];
  mode: "new" | "edit" | "copy";
  contest?: IContest;
  creator?: IFeUser;
}) => {
  const myFetch = useMyFetch();
  const fetchWcaCompDetails = useFetchWcaCompDetails();
  const {
    changeErrorMessages,
    changeSuccessMessage,
    loadingId,
    changeLoadingId,
    resetMessagesAndLoadingId,
  } = useContext(MainContext);

  const [activeTab, setActiveTab] = useState("details");
  const [detailsImported, setDetailsImported] = useState(
    mode === "edit" && contest?.type === ContestType.WcaComp,
  );
  const [queueEnabled, setQueueEnabled] = useState(
    contest?.queuePosition !== undefined,
  );

  const [competitionId, setCompetitionId] = useState(
    contest?.competitionId ?? "",
  );
  const [name, setName] = useState(contest?.name ?? "");
  const [shortName, setShortName] = useState(contest?.shortName ?? "");
  const [type, setType] = useState(contest?.type ?? ContestType.Meetup);
  const [city, setCity] = useState(contest?.city ?? "");
  const [countryIso2, setCountryIso2] = useState(
    contest?.countryIso2 ?? "NOT_SELECTED",
  );
  const [venue, setVenue] = useState(contest?.venue ?? "");
  const [address, setAddress] = useState(contest?.address ?? "");
  // Vertical coordinate (Y); ranges from -90 to 90
  const [latitude, setLatitude] = useState<NumberInputValue>(
    contest ? contest.latitudeMicrodegrees / 1000000 : 0,
  );
  // Horizontal coordinate (X); ranges from -180 to 180
  const [longitude, setLongitude] = useState<NumberInputValue>(
    contest ? contest.longitudeMicrodegrees / 1000000 : 0,
  );
  const [startDate, setStartDate] = useState(
    contest ? new Date(contest.startDate) : getDateOnly(new Date()) as Date,
  );
  // Meetup-only; set 12:00 as initial start time
  const [startTime, setStartTime] = useState(
    contest?.meetupDetails
      ? new Date(contest.meetupDetails.startTime)
      : addHours(getDateOnly(new Date()) as Date, 12),
  );
  const [endDate, setEndDate] = useState(
    contest?.endDate ? new Date(contest.endDate as Date) : new Date(),
  );
  const [organizerNames, setOrganizerNames] = useState<string[]>([
    ...(contest?.organizers.map((o) => o.name) ?? []),
    "",
  ]);
  const [organizers, setOrganizers] = useState<InputPerson[]>([
    ...(contest?.organizers ?? []),
    null,
  ]);
  const [contact, setContact] = useState(contest?.contact ?? "");
  const [description, setDescription] = useState(contest?.description ?? "");
  const [competitorLimit, setCompetitorLimit] = useState<NumberInputValue>(
    contest?.competitorLimit,
  );

  // Event stuff
  const [contestEvents, setContestEvents] = useState<IContestEvent[]>(
    contest?.events ?? [],
  );

  // Schedule stuff
  const [rooms, setRooms] = useState<IRoom[]>(
    contest?.compDetails ? contest.compDetails.schedule.venues[0].rooms : [],
  );
  const [timeZone, setTimeZone] = useState(
    contest?.compDetails?.schedule.venues[0].timezone ??
      contest?.meetupDetails?.timeZone ?? "Etc/GMT",
  );
  const [isTimeZonePending, startTimeZoneTransition] = useTransition();

  const updateTimeZone = useCallback(
    debounce(
      (lat: number, long: number) =>
        startTimeZoneTransition(async () => {
          changeErrorMessages([]);
          const res = await getTimeZoneFromCoords(lat, long);

          if (!res.success) {
            changeErrorMessages(res.errors);
          } else {
            // Adjust times
            if (type === ContestType.Meetup) {
              setStartTime(
                fromZonedTime(toZonedTime(startTime, timeZone), res.data),
              );
            } else if (getIsCompType(type)) {
              setRooms(
                rooms.map((r: IRoom) => ({
                  ...r,
                  activities: r.activities.map((a) => ({
                    ...a,
                    startTime: fromZonedTime(
                      toZonedTime(a.startTime, timeZone),
                      res.data,
                    ),
                    endTime: fromZonedTime(
                      toZonedTime(a.endTime, timeZone),
                      res.data,
                    ),
                  })),
                })),
              );
            }

            setTimeZone(res.data);
          }
        }),
      C.fetchDebounceTimeout,
    ),
    [timeZone, startTime, rooms, type],
  );

  const tabs = [
    { title: "Details", value: "details" },
    { title: "Events", value: "events" },
    { title: "Schedule", value: "schedule", hidden: !getIsCompType(type) },
  ];
  const disableIfContestApproved: boolean = mode === "edit" && !!contest &&
    contest.state >= ContestState.Approved;
  const disableIfContestPublished: boolean = mode === "edit" && !!contest &&
    contest.state >= ContestState.Published;
  const disableIfDetailsImported = !userInfo?.isAdmin && detailsImported;

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    const isCompType = getIsCompType(type);
    if (!startDate || (isCompType && !endDate) || (!isCompType && !startTime)) {
      changeErrorMessages(["Please enter valid dates"]);
      return;
    } else if (typeof latitude !== "number" || typeof longitude !== "number") {
      changeErrorMessages(["Please enter valid coordinates"]);
      return;
    }

    changeLoadingId("form_submit_button");

    const selectedOrganizers = organizers.filter((o: InputPerson) =>
      o !== null
    );
    const latitudeMicrodegrees = Math.round(latitude * 1000000);
    const longitudeMicrodegrees = Math.round(longitude * 1000000);

    // Set the contest ID for every round and empty results if there were any  in order to avoid sending
    // too much data to the backend. Remove internal IDs in case we're copying a contest.
    const processedCompEvents = contestEvents.map((ce: IContestEvent) => ({
      ...ce,
      rounds: ce.rounds.map((round) => ({
        ...round,
        competitionId,
        results: [],
      })),
    }));

    let compDetails: ICompetitionDetails | undefined;
    let meetupDetails: IMeetupDetails | undefined;

    if (getIsCompType(type)) {
      compDetails = {
        schedule: {
          competitionId,
          venues: [
            {
              id: 1,
              name: venue || "Unknown venue",
              countryIso2,
              latitudeMicrodegrees,
              longitudeMicrodegrees,
              timezone: "TEMPORARY", // this is set on the backend
              // Only send the rooms that have at least one activity
              rooms: rooms.filter((r: IRoom) => r.activities.length > 0),
            },
          ],
        },
      };
    } else {
      meetupDetails = {
        startTime,
        timeZone: "TEMPORARY", // this is set on the backend
      };
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
      description: description.trim(),
      competitorLimit: competitorLimit || undefined,
      events: processedCompEvents,
      compDetails,
      meetupDetails,
    };

    const getRoundWithDefaultTimeLimitExists = () =>
      processedCompEvents.some((ce: IContestEvent) =>
        ce.rounds.some((r) =>
          r.timeLimit?.centiseconds === 60000 &&
          r.timeLimit?.cumulativeRoundIds.length === 0
        )
      );
    const confirmDefaultTimeLimitMsg =
      "You have a round with a default time limit of 10:00. A round with a high time limit may take too long. Are you sure you would like to keep this time limit?";
    const doSubmit = mode !== "edit"
      ? (
        !getRoundWithDefaultTimeLimitExists() ||
        confirm(confirmDefaultTimeLimitMsg)
      )
      : (competitionId === contest?.competitionId ||
        confirm(
          `Are you sure you would like to change the contest ID from ${contest?.competitionId} to ${competitionId}?`,
        ));

    if (doSubmit) {
      // Validation
      const tempErrors: string[] = [];
      if (
        selectedOrganizers.length <
          organizerNames.filter((on: string) => on !== "").length
      ) {
        tempErrors.push("Please enter all organizers");
      }
      if (type === ContestType.WcaComp && !detailsImported) {
        tempErrors.push(
          'You must use the "Get WCA competition details" feature',
        );
      }

      if (tempErrors.length > 0) {
        changeErrorMessages(tempErrors);
      } else {
        const res = mode === "edit"
          ? await myFetch.patch(
            `/competitions/${contest?.competitionId}`,
            newComp,
            { loadingId: null },
          )
          : await myFetch.post("/competitions", newComp, { loadingId: null });

        if (!res.success) changeErrorMessages(res.errors);
        else window.location.href = "/mod";
      }
    } else {
      changeLoadingId("");
    }
  };

  const fillWithMockData = async (
    mockContestType = ContestType.Competition,
  ) => {
    const res = await myFetch.get<IFePerson>(
      `/persons?personId=${userInfo?.personId}`,
      {
        loadingId: "set_mock_comp_button",
      },
    );

    if (res.success) {
      setType(mockContestType);
      setCity("Singapore");
      setCountryIso2("SG");
      setAddress("Address");
      setVenue("Venue");
      setLatitude(1.314663);
      setLongitude(103.845409);
      setTimeZone("Asia/Singapore");
      setOrganizerNames([res.data.name, ""]);
      setOrganizers([res.data, null]);
      setContact(`${userInfo?.username}@cc.com`);
      setDescription("THIS IS A MOCK CONTEST FOR TESTING!");
      setCompetitorLimit(100);

      const year = new Date().getFullYear();

      if (mockContestType === ContestType.Meetup) {
        setName(`New Meetup ${year}`);
        setShortName(`New Meetup ${year}`);
        setCompetitionId(`NewMeetup${year}`);
      } else {
        setName(`New Competition ${year}`);
        setShortName(`New Competition ${year}`);
        setCompetitionId(`NewCompetition${year}`);
        setRooms([{ id: 1, name: "Main", color: Color.White, activities: [] }]);
      }
    }
  };

  const changeActiveTab = (newTab: string) => {
    if (
      newTab === "schedule" &&
      (typeof latitude !== "number" || typeof longitude !== "number")
    ) {
      changeErrorMessages(["Please enter valid coordinates first"]);
    } else {
      setActiveTab(newTab);

      if (newTab === "events") {
        // If the rounds that are supposed to have time limits don't have them
        // (this can be true for old contests), set them to empty time limits
        setContestEvents(
          contestEvents.map((ce: IContestEvent) => ({
            ...ce,
            rounds: ce.rounds.map((r: IRound) => ({
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
    if (mode !== "edit") {
      if (competitionId === getContestIdFromName(name)) {
        setCompetitionId(getContestIdFromName(value));
      }
      if (shortName === name && value.length <= 32) setShortName(value);
    }

    setName(value);
  };

  const changeShortName = (value: string) => {
    // Only update the value if the new one is within the allowed limit, or if it's shorter than it was (e.g. when Backspace is pressed)
    if (value.length <= 32 || value.length < shortName.length) {
      setShortName(value);
    }
  };

  const getWcaCompDetails = async () => {
    if (!competitionId) {
      changeErrorMessages(["Please enter a contest ID"]);
      return;
    }

    try {
      changeLoadingId("get_wca_comp_details_button");
      const newContest = await fetchWcaCompDetails(competitionId);

      const latitude = Number(
        (newContest.latitudeMicrodegrees / 1000000).toFixed(6),
      );
      const longitude = Number(
        (newContest.longitudeMicrodegrees / 1000000).toFixed(6),
      );

      setName(newContest.name);
      setShortName(newContest.shortName);
      setCity(newContest.city);
      setCountryIso2(newContest.countryIso2);
      setAddress(newContest.address);
      setVenue(newContest.venue);
      setStartDate(newContest.startDate);
      setEndDate(newContest.endDate as Date);
      setOrganizers([...newContest.organizers, null]);
      setOrganizerNames([...newContest.organizers.map((o) => o.name), ""]);
      setDescription(newContest.description);
      setCompetitorLimit(newContest.competitorLimit);
      await changeCoordinates(latitude, longitude);
      setDetailsImported(true);
      resetMessagesAndLoadingId();
    } catch (err: any) {
      if (err.message.includes("Not found")) {
        changeErrorMessages([
          `Competition with ID ${competitionId} not found. This may be because it's not been enough time since it was announced. If so, please try again in 24 hours.`,
        ]);
      } else changeErrorMessages([err.message]);
    }
  };

  const changeCoordinates = (
    newLat: NumberInputValue,
    newLong: NumberInputValue,
  ) => {
    const parsed = CoordinatesValidator.safeParse({
      latitude: newLat,
      longitude: newLong,
    });

    setLatitude(newLat);
    setLongitude(newLong);

    if (parsed.success) {
      updateTimeZone(parsed.data.latitude, parsed.data.longitude);
    }
  };

  const changeStartDate = (newDate: Date) => {
    if (!getIsCompType(type)) {
      setStartTime(newDate);
      setStartDate(getDateOnly(toZonedTime(newDate, timeZone)) as Date);
    } else {
      setStartDate(newDate);

      if (newDate.getTime() > endDate.getTime()) setEndDate(newDate);
    }
  };

  const cloneContest = () => {
    changeLoadingId("clone_contest_button");
    window.location.href = `/mod/competition?copy_id=${contest?.competitionId}`;
  };

  const unfinishContest = async () => {
    const answer = confirm(
      `Are you sure you would like to set ${
        (contest as IContest).name
      } back to ongoing?`,
    );

    if (answer) {
      const res = await myFetch.patch(
        `/competitions/set-state/${competitionId}`,
        { newState: ContestState.Ongoing },
        { loadingId: "unfinish_contest_button", keepLoadingOnSuccess: true },
      );

      if (res.success) window.location.href = "/mod";
    }
  };

  const removeContest = async () => {
    const answer = confirm(
      `Are you sure you would like to remove ${(contest as IContest).name}?`,
    );

    if (answer) {
      const res = await myFetch.delete(
        `/competitions/${competitionId}`,
        { loadingId: "delete_contest_button", keepLoadingOnSuccess: true },
      );

      if (res.success) window.location.href = "/mod";
    }
  };

  const downloadScorecards = (pageSize: PageSize) => {
    myFetch.get(
      `/scorecards/${contest?.competitionId}?pageSize=${pageSize}`,
      {
        authorize: true,
        fileName: `${contest?.competitionId}_Scorecards.pdf`,
        loadingId: `download_scorecards_${pageSize.toLowerCase()}_button`,
      },
    );
  };

  const enableQueue = async () => {
    const res = await myFetch.patch(
      `/competitions/queue-reset/${(contest as IContest).competitionId}`,
      {},
      {
        loadingId: "enable_queue_button",
      },
    );

    if (res.success) setQueueEnabled(true);
  };

  const createAuthToken = async () => {
    const res = await myFetch.get(
      `/create-auth-token/${contest?.competitionId}`,
      { authorize: true, loadingId: "get_access_token_button" },
    );

    if (res.success) {
      changeSuccessMessage(`Your new access token is ${res.data}`);
    }
  };

  return (
    <div>
      <Form
        buttonText={mode === "edit" ? "Save Contest" : "Create Contest"}
        onSubmit={handleSubmit}
        disableButton={disableIfContestPublished}
      >
        {mode === "edit" && creator && <CreatorDetails creator={creator} />}

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={changeActiveTab}
        />

        {activeTab === "details" && (
          <>
            {mode === "new" && (
              <>
                {process.env.NODE_ENV !== "production" && (
                  <div className="d-flex flex-wrap gap-3 my-3">
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

                <p className="mb-4 fs-6 fw-bold fst-italic text-info">
                  Come back here after the contest gets approved to generate the
                  scorecards!
                </p>
              </>
            )}
            {mode === "edit" && contest && (
              <>
                <div className="d-flex flex-wrap gap-3 mt-3 mb-3">
                  {contest.type !== ContestType.WcaComp && (
                    // This has to be done like this, because redirection using <Link/> breaks the clone contest feature
                    <Button
                      id="clone_contest_button"
                      onClick={cloneContest}
                      loadingId={loadingId}
                    >
                      Clone
                    </Button>
                  )}
                  {userInfo?.isAdmin && (
                    <>
                      {contest.state === ContestState.Finished && (
                        <Button
                          id="unfinish_contest_button"
                          onClick={unfinishContest}
                          loadingId={loadingId}
                          className="btn-warning"
                        >
                          Un-finish Contest
                        </Button>
                      )}
                      <Button
                        id="delete_contest_button"
                        onClick={removeContest}
                        loadingId={loadingId}
                        disabled={contest.participants > 0}
                        className="btn-danger"
                      >
                        Remove Contest
                      </Button>
                    </>
                  )}
                  <Button
                    id="download_scorecards_a4_button"
                    onClick={() => downloadScorecards("A4")}
                    loadingId={loadingId}
                    disabled={contest.state < ContestState.Approved}
                    className="btn-success"
                  >
                    Scorecards (A4)
                  </Button>
                  <Button
                    id="download_scorecards_a6_button"
                    onClick={() => downloadScorecards("A6")}
                    loadingId={loadingId}
                    disabled={contest.state < ContestState.Approved}
                    className="btn-success"
                  >
                    Scorecards (A6)
                  </Button>
                  <div className="d-flex align-items-center gap-1">
                    <Button
                      id="enable_queue_button"
                      onClick={enableQueue}
                      loadingId={loadingId}
                      disabled={contest.state < ContestState.Approved ||
                        contest.state >= ContestState.Finished ||
                        queueEnabled}
                      className="btn-secondary"
                    >
                      {queueEnabled ? "Queue Enabled" : "Enable Queue"}
                    </Button>
                    <Tooltip
                      id="queue_tooltip"
                      text="This can be used for contests where there are not enough solving stations. In such cases random scrambles must be used for every competitor."
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <Button
                      id="get_access_token_button"
                      onClick={createAuthToken}
                      loadingId={loadingId}
                      disabled={contest.state < ContestState.Approved ||
                        contest.state >= ContestState.Finished}
                      className="btn-secondary"
                    >
                      Get Access Token
                    </Button>
                    <Tooltip
                      id="access_token_tooltip"
                      text="Used for external data entry (e.g. using a paperless scoretaking system or a third-party tool)"
                    />
                  </div>
                </div>
                <p className="mb-3 fs-6 fst-italic">
                  If the scorecards aren't generating correctly, please report
                  this to the admins!
                </p>
              </>
            )}
            <FormTextInput
              title="Contest name"
              value={name}
              setValue={changeName}
              autoFocus
              disabled={disableIfDetailsImported || disableIfContestPublished}
              className="mb-3"
            />
            <FormTextInput
              title="Short name"
              value={shortName}
              setValue={changeShortName}
              disabled={disableIfDetailsImported || disableIfContestPublished}
              className="mb-3"
            />
            <FormTextInput
              title="Contest ID"
              value={competitionId}
              setValue={setCompetitionId}
              disabled={disableIfContestApproved || disableIfDetailsImported ||
                (mode === "edit" && !userInfo?.isAdmin)}
              className="mb-3"
            />
            <FormRadio
              title="Type"
              options={contestTypeOptions.filter((ct) => !ct.disabled)}
              selected={type}
              setSelected={setType}
              disabled={mode !== "new" || disableIfDetailsImported}
            />
            {type === ContestType.WcaComp && mode === "new" && (
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
            <div className="row mb-3">
              <div className="col">
                <FormTextInput
                  title="City"
                  value={city}
                  setValue={setCity}
                  disabled={disableIfDetailsImported ||
                    disableIfContestPublished}
                />
              </div>
              <div className="col">
                <FormCountrySelect
                  countryIso2={countryIso2}
                  setCountryIso2={setCountryIso2}
                  disabled={mode === "edit" || disableIfDetailsImported}
                />
              </div>
            </div>
            <FormTextInput
              title="Address"
              value={address}
              setValue={setAddress}
              disabled={disableIfDetailsImported || disableIfContestPublished}
              className="mb-3"
            />
            <div className="row">
              <div className="col-12 col-md-6 mb-3">
                <FormTextInput
                  title="Venue"
                  value={venue}
                  setValue={setVenue}
                  disabled={disableIfDetailsImported ||
                    disableIfContestPublished}
                />
              </div>
              <div className="col-12 col-md-6">
                <div className="row mb-3">
                  <div className="col-6">
                    <FormNumberInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val) => changeCoordinates(val, longitude)}
                      disabled={disableIfContestApproved ||
                        disableIfDetailsImported}
                      min={-90}
                      max={90}
                    />
                  </div>
                  <div className="col-6">
                    <FormNumberInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val) => changeCoordinates(latitude, val)}
                      disabled={disableIfContestApproved ||
                        disableIfDetailsImported}
                      min={-180}
                      max={180}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="text-secondary fs-6 mb-2">
                    Time zone:{" "}
                    {isTimeZonePending
                      ? <Loading small dontCenter />
                      : timeZone}
                  </div>
                  <div className="text-danger fs-6">
                    The coordinates must point to a building and match the
                    address of the venue.
                  </div>
                </div>
              </div>
            </div>
            <div className="my-3 row">
              <div className="col">
                {type === ContestType.Meetup
                  ? (
                    <FormDatePicker
                      id="start_date"
                      title={`Start date and time (${
                        isTimeZonePending ? "..." : timeZone
                      })`}
                      value={startTime}
                      setValue={changeStartDate}
                      timeZone={timeZone}
                      disabled={disableIfContestApproved}
                      dateFormat="Pp"
                      showUTCTime
                    />
                  )
                  : (
                    <FormDatePicker
                      id="start_date"
                      title="Start date"
                      value={startDate}
                      setValue={changeStartDate}
                      disabled={disableIfContestApproved ||
                        disableIfDetailsImported}
                      dateFormat="P"
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
                    disabled={disableIfContestApproved ||
                      disableIfDetailsImported}
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
                disabled={(disableIfContestApproved && !userInfo?.isAdmin) ||
                  disableIfContestPublished}
                addNewPersonMode="from-new-tab"
              />
            </div>
            <FormTextInput
              id="contact"
              title="Contact (optional)"
              placeholder="john@example.com"
              value={contact}
              setValue={setContact}
              disabled={disableIfContestPublished}
              className="mb-3"
            />
            <FormTextArea
              title="Description (optional, Markdown supported)"
              value={description}
              setValue={setDescription}
              disabled={disableIfContestPublished}
            />
            {type === ContestType.WcaComp && (
              <div>
                <p className="fs-6">
                  The description must be available in English for WCA
                  competitions. You may still include versions written in other
                  languages, and the order doesn't matter.
                </p>
                <p className="fs-6 fst-italic">
                  The following text will be displayed above the description on
                  the contest page:
                </p>
                <div className="mx-2">
                  <WcaCompAdditionalDetails
                    name={name || "CONTEST NAME"}
                    competitionId={competitionId}
                  />
                </div>
              </div>
            )}
            <FormNumberInput
              title={"Competitor limit" +
                (!getIsCompType(type) ? " (optional)" : "")}
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={(disableIfContestApproved && !userInfo?.isAdmin) ||
                disableIfDetailsImported ||
                disableIfContestPublished}
              integer
              min={C.minCompetitorLimit}
            />
          </>
        )}

        {activeTab === "events" && (
          <ContestEvents
            events={events}
            contestEvents={contestEvents}
            setContestEvents={setContestEvents}
            contestType={type}
            disabled={disableIfContestPublished}
            disableNewEvents={disableIfContestApproved && !userInfo?.isAdmin}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleEditor
            rooms={rooms}
            setRooms={setRooms}
            venueTimeZone={timeZone}
            startDate={startDate}
            contestType={type}
            contestEvents={contestEvents}
            disabled={disableIfContestPublished}
          />
        )}
      </Form>
    </div>
  );
};

export default ContestForm;
