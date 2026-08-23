"use client";

import { addYears, isValid } from "date-fns";
import { fromZonedTime, getTimezoneOffset, toZonedTime } from "date-fns-tz";
import debounce from "lodash/debounce";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useContext, useState, useTransition } from "react";
import z from "zod";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormDatePicker from "~/app/components/form/FormDatePicker.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import FormRadio from "~/app/components/form/FormRadio.tsx";
import FormRegionSelect from "~/app/components/form/FormRegionSelect.tsx";
import FormTextArea from "~/app/components/form/FormTextArea.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import Loading from "~/app/components/UI/Loading.tsx";
import Tabs from "~/app/components/UI/Tabs.tsx";
import WcaCompAdditionalDetails from "~/app/components/WcaCompAdditionalDetails.tsx";
import { C, IS_CUBING_CONTESTS_INSTANCE } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import type { Room, Schedule } from "~/helpers/types/Schedule.ts";
import type { ContestType, Creator, InputPerson } from "~/helpers/types.ts";
import {
  getActionError,
  getContestIdFromName,
  getDateOnly,
  getHasRole,
  getIsUrgent,
  slugPath,
} from "~/helpers/utility-functions.ts";
import { ContestValidator } from "~/helpers/validators/Contest.ts";
import { CoordinatesValidator } from "~/helpers/validators/Coordinates.ts";
import type { RoundDto } from "~/helpers/validators/Round.ts";
import { WcaCompetitionValidator } from "~/helpers/validators/wca/WcaCompetition.ts";
import type { SelectContest } from "~/server/db/schema/contests.ts";
import type { EventResponseWithCategory } from "~/server/db/schema/events.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import type { RoundResponse } from "~/server/db/schema/rounds.ts";
import {
  createContestSF,
  getTimeZoneFromCoordsSF,
  removeContestSF,
  unfinishContestSF,
  updateAdminNotesSF,
  updateContestSF,
} from "~/server/server-functions/contest-server-functions.ts";
import {
  getOrCreatePersonByWcaIdSF,
  getOrCreatePersonSF,
  getPersonByIdSF,
} from "~/server/server-functions/person-server-functions.ts";
import ContestEvents from "./ContestEvents.tsx";
import ScheduleEditor from "./ScheduleEditor.tsx";

const onlineContestRooms: Room[] = [{ id: 1, name: C.onlineCompKey, color: "#fff", activities: [] }];

type Props = {
  events: EventResponseWithCategory[];
  rounds: RoundResponse[] | undefined;
  totalResultsByRound: { roundId: number; totalResults: number }[] | undefined;
  contestTypes: ContestType[];
  mode: "new" | "edit" | "copy";
  contest: SelectContest | undefined;
  organizers: PersonResponse[] | undefined;
  creator: Creator | null | undefined; // null means the user has been deleted
};

function ContestForm({
  events,
  rounds: initRounds = [],
  totalResultsByRound,
  contestTypes,
  mode,
  contest,
  organizers: initOrganizers = [],
  creator,
}: Props) {
  const router = useRouter();
  const { slug }: { slug: string } = useParams();
  const { member } = useSession();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: getPersonById, isPending: isGettingPerson } = useAction(getPersonByIdSF);
  const { executeAsync: getOrCreatePersonByWcaId, isPending: isGettingOrCreatingWcaPerson } =
    useAction(getOrCreatePersonByWcaIdSF);
  const { executeAsync: getOrCreatePerson, isPending: isGettingOrCreatingPerson } = useAction(getOrCreatePersonSF);
  const { executeAsync: getTimeZoneFromCoords, isPending: isPendingTimeZone } = useAction(getTimeZoneFromCoordsSF);
  const { executeAsync: createContest, isPending: isCreating } = useAction(createContestSF);
  const { executeAsync: updateContest, isPending: isUpdating } = useAction(updateContestSF);
  const { executeAsync: unfinishContest, isPending: isUnfinishing } = useAction(unfinishContestSF);
  const { executeAsync: removeContest, isPending: isDeleting } = useAction(removeContestSF);
  const { executeAsync: updateAdminNotes, isPending: isUpdatingAdminNotes } = useAction(updateAdminNotesSF);
  const [activeTab, setActiveTab] = useState("details");
  const [detailsImported, setDetailsImported] = useState(mode === "edit" && contest?.type === "wca-comp");

  const [competitionId, setCompetitionId] = useState(contest?.competitionId ?? "");
  const [isPendingWcaCompDetails, startWcaCompDetailsTransition] = useTransition();
  const [name, setName] = useState(contest?.name ?? "");
  const [shortName, setShortName] = useState(contest?.shortName ?? "");
  const [type, setType] = useState<ContestType | undefined>(
    contest?.type ?? (contestTypes.length === 1 ? contestTypes[0] : undefined),
  );
  const [city, setCity] = useState(contest?.city ?? "");
  const [regionCode, setRegionCode] = useState(contest?.regionCode ?? (type === "online" ? "XW" : C.notSelectedOption));
  const [venue, setVenue] = useState(contest?.venue ?? "");
  const [address, setAddress] = useState(contest?.address ?? "");
  // Vertical coordinate (Y); ranges from -90 to 90
  const [latitude, setLatitude] = useState<number | undefined>(contest ? contest.latitudeMicrodegrees / 1000000 : 0);
  // Horizontal coordinate (X); ranges from -180 to 180
  const [longitude, setLongitude] = useState<number | undefined>(contest ? contest.longitudeMicrodegrees / 1000000 : 0);
  const [startDate, setStartDate] = useState(contest?.startDate ?? undefined);
  const [endDate, setEndDate] = useState(contest?.endDate ?? undefined);
  const [startTime, setStartTime] = useState(contest?.startTime ?? undefined);
  const [organizers, setOrganizers] = useState<InputPerson[]>([...initOrganizers, null]);
  const [organizerNames, setOrganizerNames] = useState([...(initOrganizers?.map((o) => o.name) ?? []), ""]);
  const [contact, setContact] = useState(contest?.contact ?? "");
  const [description, setDescription] = useState(contest?.description ?? "");
  const [competitorLimit, setCompetitorLimit] = useState<number | undefined>(contest?.competitorLimit ?? undefined);
  const [adminNotes, setAdminNotes] = useState(contest?.adminNotes ?? "");

  // Event stuff
  const [rounds, setRounds] = useState<RoundDto[]>(initRounds);

  // Schedule stuff
  const [rooms, setRooms] = useState<Room[]>(
    contest?.schedule?.venues[0].rooms ?? (type === "online" ? onlineContestRooms : []),
  );
  const [timezone, setTimezone] = useState(contest?.schedule?.venues[0].timezone ?? contest?.timezone ?? "Etc/GMT");
  const [isCompPhotosUnderstood, setIsCompPhotosUnderstood] = useState(mode === "edit" || !IS_CUBING_CONTESTS_INSTANCE);
  const [isTimelinessUnderstood, setIsTimelinessUnderstood] = useState(mode === "edit");

  const updateTimeZone = useCallback(
    debounce(async (lat: number, long: number) => {
      changeErrorMessages([]);
      const res = await getTimeZoneFromCoords({ latitude: lat, longitude: long });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else {
        // Adjust times
        if (isValid(startDate) && isValid(startTime)) {
          if (type === "meetup") {
            setStartTime(fromZonedTime(toZonedTime(startTime!, timezone), res.data!));
          } else {
            setRooms(
              rooms.map((r: Room) => ({
                ...r,
                activities: r.activities.map((a) => ({
                  ...a,
                  startTime: fromZonedTime(toZonedTime(a.startTime, timezone), res.data!),
                  endTime: fromZonedTime(toZonedTime(a.endTime, timezone), res.data!),
                })),
              })),
            );
          }
        }

        setTimezone(res.data!);
      }
    }, C.fetchDebounceTimeout),
    [timezone, startTime, rooms, type],
  );

  const isAdmin = getHasRole("admin", member?.role) || getHasRole("owner", member?.role);
  const modDashboardUrl = slugPath(slug, `/mod${isAdmin && IS_CUBING_CONTESTS_INSTANCE ? "?state=pending" : ""}`);
  const isPending =
    isCreating ||
    isUpdating ||
    isUnfinishing ||
    isDeleting ||
    isPendingTimeZone ||
    isPendingWcaCompDetails ||
    isGettingOrCreatingWcaPerson ||
    isGettingOrCreatingPerson ||
    isUpdatingAdminNotes;
  const disabled = !type || (type === "wca-comp" && !detailsImported);
  const disabledIfContestApproved: boolean = mode === "edit" && !!contest && contest.state !== "created";
  const disabledIfContestPublished: boolean = mode === "edit" && !!contest && contest.state === "published";
  const disabledIfDetailsImported = !isAdmin && detailsImported;
  const urgent = isValid(startDate) && getIsUrgent(startDate!);
  const disabledIfNotUnderstood = !isTimelinessUnderstood && urgent;
  const tabs = [
    { title: "Details", value: "details", disabled: isPending },
    { title: "Events", value: "events", hidden: !type, disabled: isPending },
    {
      title: "Schedule",
      value: "schedule",
      hidden: !type || type === "meetup",
      disabled: isPending || !isValid(startDate),
    },
  ];

  const handleSubmit = async () => {
    const selectedOrganizers = organizers.filter((o: InputPerson) => o !== null);
    // If one of these is 0, the validator will catch it
    const latitudeMicrodegrees = latitude ? Math.round(latitude * 1000000) : 0;
    const longitudeMicrodegrees = longitude ? Math.round(longitude * 1000000) : 0;
    let schedule: Schedule | null = null;

    if (type !== "meetup") {
      schedule = {
        venues: [
          {
            id: 1,
            name: type === "online" ? C.onlineCompKey : venue,
            countryIso2: regionCode,
            latitudeMicrodegrees,
            longitudeMicrodegrees,
            timezone,
            // Only send the rooms that have at least one activity
            rooms: rooms.filter((r) => r.activities.length > 0),
          },
        ],
      };
    }

    const parsed = ContestValidator.safeParse({
      competitionId,
      name: name.trim(),
      shortName: shortName.trim(),
      type: type!,
      city: type === "online" ? C.onlineCompKey : city.trim(),
      regionCode,
      venue,
      address,
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate: startDate!,
      endDate: endDate!,
      startTime: type === "meetup" ? startTime : null,
      timezone: type === "meetup" ? timezone : null,
      organizerIds: selectedOrganizers.map((o) => o.id),
      contact: contact.trim() || null,
      description: description.trim() || null,
      competitorLimit: competitorLimit ?? null,
      schedule,
    });

    // Validation
    const tempErrors: string[] = parsed.success ? [] : [z.prettifyError(parsed.error)];
    if (selectedOrganizers.length < organizerNames.filter((name) => name !== "").length)
      tempErrors.push("Please enter all organizers");
    if (type === "wca-comp" && !detailsImported)
      tempErrors.push('You must use the "Get WCA competition details" feature');
    if (tempErrors.length > 0) {
      changeErrorMessages(tempErrors);
      return;
    }

    const roundWithDefaultTimeLimitExists = rounds.some(
      (r) => r.timeLimitCentiseconds === C.defaultTimeLimit && !r.timeLimitCumulativeRoundIds,
    );
    const confirmDefaultTimeLimitMsg =
      "You have a round with a default time limit of 10:00. A round with a high time limit may take too long. Are you sure you would like to keep this time limit?";
    const doSubmit: boolean =
      mode === "edit"
        ? competitionId === contest!.competitionId ||
          confirm(
            `Are you sure you would like to change the competition ID from ${contest!.competitionId} to ${competitionId}?`,
          )
        : !IS_CUBING_CONTESTS_INSTANCE || !roundWithDefaultTimeLimitExists || confirm(confirmDefaultTimeLimitMsg);
    if (!doSubmit) return;

    const res =
      mode === "edit"
        ? await updateContest({
            originalCompetitionId: contest!.competitionId,
            newContestDto: parsed.data!,
            rounds: rounds.map((r) => ({ ...r, competitionId })),
          })
        : await createContest({ newContestDto: parsed.data!, rounds: rounds.map((r) => ({ ...r, competitionId })) });

    if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
    else router.push(modDashboardUrl);
  };

  const submitAdminNotes = async () => {
    resetMessages();
    const res = await updateAdminNotes({ competitionId: contest!.competitionId, adminNotes: adminNotes || null });

    if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
    else changeSuccessMessage("Admin notes successfully updated");
  };

  const fillWithMockData = async (mockContestType: ContestType = "comp") => {
    const res = await getPersonById({ id: member!.personId! });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      setType(mockContestType);
      setCity("Singapore");
      setRegionCode("SG");
      setAddress("Address");
      setVenue("Venue");
      setLatitude(1.314663);
      setLongitude(103.845409);
      const tz = "Asia/Singapore";
      setTimezone(tz);
      setOrganizerNames([res.data!.name, ""]);
      setOrganizers([res.data!, null]);
      setContact("contact@example.com");
      setDescription("THIS IS A MOCK CONTEST FOR TESTING!");
      setCompetitorLimit(100);

      const year = new Date().getFullYear();

      if (mockContestType === "meetup") {
        setName(`New Meetup ${year}`);
        setShortName(`New Meetup ${year}`);
        setCompetitionId(`NewMeetup${year}`);
        const time = addYears(new Date(), 1);
        setStartTime(time);
        const date = getDateOnly(toZonedTime(time, tz))!;
        setStartDate(date);
        setEndDate(date);
      } else {
        setName(`New Competition ${year}`);
        setShortName(`New Competition ${year}`);
        setCompetitionId(`NewCompetition${year}`);
        const date = addYears(getDateOnly(new Date())!, 1);
        setStartDate(date);
        setEndDate(date);
        setRooms([{ id: 1, name: "Main", color: "#fff", activities: [] }]);
      }
    }
  };

  const changeActiveTab = (newTab: string) => {
    if (newTab === "schedule" && (typeof latitude !== "number" || typeof longitude !== "number")) {
      changeErrorMessages(["Please enter valid coordinates first"]);
    } else {
      setActiveTab(newTab);

      if (newTab === "events") {
        // If the rounds that are supposed to have time limits don't have them
        // (this can be true for old contests), set them to empty time limits
        setRounds(
          rounds.map((r) => {
            if (r.timeLimitCentiseconds) return r; // if it already has a time limit, don't change anything
            const event = events.find((e) => e.eventId === r.eventId)!;
            if (!["time", "time-3d"].includes(event.format)) return r;
            return { ...r, timeLimitCentiseconds: C.defaultTimeLimit, timeLimitCumulativeRoundIds: null };
          }),
        );
      }
    }
  };

  const changeType = (newType: ContestType) => {
    setType(newType);

    if (newType === "online") {
      setRegionCode("XW");
      setRooms(onlineContestRooms);
    }
  };

  const changeName = (value: string) => {
    // If not editing a competition, update Competition ID accordingly, unless it deviates from the name
    if (mode !== "edit" && competitionId === getContestIdFromName(name)) setCompetitionId(getContestIdFromName(value));
    if (shortName === name && value.length <= 32) setShortName(value);

    setName(value);
  };

  const changeShortName = (value: string) => {
    // Only update the value if the new one is within the allowed limit, or if it's shorter than it was (e.g. when Backspace is pressed)
    if (value.length <= 32 || value.length < shortName.length) setShortName(value);
  };

  const getWcaCompDetails = () => {
    if (!competitionId) {
      changeErrorMessages(["Please enter a competition ID"]);
      return;
    }

    startWcaCompDetailsTransition(async () => {
      const wcaCompData = await fetch(`${C.wcaApiBaseUrl}/competitions/${competitionId}`)
        .then(async (res) => {
          const notFoundMsg = `Competition with ID ${competitionId} not found. Please report this to the admin team.`;
          if (res.status === 404) throw new Error(notFoundMsg);
          if (!res.ok) throw new Error(C.message.unknownError);
          const data = await res.json();
          return WcaCompetitionValidator.parse(data);
        })
        .catch((err) => {
          changeErrorMessages([err.message]);
        });
      if (!wcaCompData) return;

      const organizers: PersonResponse[] = [];
      const organizersWcaInternalIds = new Set<number>();
      const notFoundPersonNames = new Set();

      // Set organizer objects
      for (const org of [...wcaCompData.organizers, ...wcaCompData.delegates]) {
        // It's possible that the same person is both a delegate and organizer
        if (organizersWcaInternalIds.has(org.id)) continue;
        organizersWcaInternalIds.add(org.id);

        const res = org.wca_id
          ? await getOrCreatePersonByWcaId({ wcaId: org.wca_id })
          : await getOrCreatePerson({ name: org.name, regionCode: org.country_iso2 });

        if (!res.data) notFoundPersonNames.add(org.name);
        else if (!organizers.some((o) => o.id === res.data!.person.id)) organizers.push(res.data.person);
      }

      if (notFoundPersonNames.size > 0) {
        const notFoundNames = Array.from(notFoundPersonNames).join(", ");
        changeErrorMessages([`Organizers with these names were not found: ${notFoundNames}`]);
        return;
      }

      setName(wcaCompData.name);
      setShortName(wcaCompData.short_name);
      setCity(wcaCompData.city);
      setRegionCode(wcaCompData.country_iso2);
      // Gets rid of the link and just takes the venue name
      setVenue(wcaCompData.venue.split("]")[0].replace("[", ""));
      setAddress(wcaCompData.venue_address);
      changeCoordinates(wcaCompData.latitude_degrees, wcaCompData.longitude_degrees);
      setStartDate(new Date(wcaCompData.start_date));
      setEndDate(new Date(wcaCompData.end_date));
      setCompetitorLimit(wcaCompData.competitor_limit);
      setOrganizers([...organizers, null]);
      setOrganizerNames([...organizers.map((o) => o.name), ""]);
      setDescription("");

      setDetailsImported(true);
      resetMessages();
    });
  };

  const changeCoordinates = (newLat: number | undefined, newLong: number | undefined) => {
    const parsed = CoordinatesValidator.safeParse({ latitude: newLat, longitude: newLong });

    setLatitude(newLat);
    setLongitude(newLong);

    if (parsed.success) updateTimeZone(parsed.data.latitude, parsed.data.longitude);
  };

  const changeStartDate = (newDate: Date | undefined) => {
    if (type === "meetup") {
      setStartTime(newDate);
      if (isValid(newDate)) {
        const newStartDate = getDateOnly(new Date(newDate!.getTime() + getTimezoneOffset(timezone)))!;
        setStartDate(newStartDate);
        setEndDate(newStartDate);
      }
    } else {
      setStartDate(newDate);
      if (isValid(newDate) && isValid(endDate) && newDate!.getTime() > endDate!.getTime()) setEndDate(newDate);
    }
  };

  const changeEndDate = (newDate: Date | undefined) => {
    setEndDate(newDate);

    if (isValid(newDate) && isValid(startDate) && newDate!.getTime() < startDate!.getTime()) {
      setStartDate(newDate);
    }
  };

  const onUnfinishContest = async () => {
    if (confirm(`Are you sure you would like to un-finish ${contest!.name}?`)) {
      const res = await unfinishContest({ competitionId });

      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      else router.push(modDashboardUrl);
    }
  };

  const onRemoveContest = async () => {
    if (confirm(`Are you sure you would like to remove ${contest!.name}?`)) {
      const res = await removeContest({ competitionId });

      if (res.serverError || res.validationErrors) changeErrorMessages([getActionError(res)]);
      else router.push(modDashboardUrl);
    }
  };

  return (
    <Form
      buttonText={mode === "edit" ? "Save Competition" : "Create Competition"}
      onSubmit={handleSubmit}
      isLoading={isCreating || isUpdating}
      disableControls={isPending || disabled || disabledIfContestPublished || disabledIfNotUnderstood}
    >
      {mode === "edit" && isAdmin && <CreatorDetails creator={creator ?? null} className="mb-3" />}

      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

      {activeTab === "details" && (
        <>
          {mode === "new" && process.env.NODE_ENV !== "production" && !type && (
            <div className="d-flex my-3 flex-wrap gap-3">
              {contestTypes.includes("comp") && (
                <Button onClick={() => fillWithMockData()} isLoading={isGettingPerson} className="btn-secondary">
                  Set Mock Competition
                </Button>
              )}
              {contestTypes.includes("meetup") && (
                <Button
                  onClick={() => fillWithMockData("meetup")}
                  isLoading={isGettingPerson}
                  className="btn-secondary"
                >
                  Set Mock Meetup
                </Button>
              )}
            </div>
          )}
          {mode === "edit" && contest && (
            <>
              <div className="d-flex my-3 flex-wrap gap-3">
                {contest.type !== "wca-comp" && (
                  <Link
                    href={slugPath(slug, `/mod/competition?copyId=${contest.competitionId}`)}
                    prefetch={false}
                    className="btn btn-primary"
                  >
                    Clone
                  </Link>
                )}
                {isAdmin && (
                  <>
                    {["finished", "published"].includes(contest.state) && (
                      <Button
                        type="button"
                        onClick={() => onUnfinishContest()}
                        isLoading={isUnfinishing}
                        disabled={isPending}
                        className="btn-warning"
                      >
                        Un-finish Competition
                      </Button>
                    )}
                    <Button
                      onClick={onRemoveContest}
                      isLoading={isDeleting}
                      disabled={isPending || contest.participants > 0}
                      className="btn-danger"
                    >
                      Remove Competition
                    </Button>
                  </>
                )}
              </div>
              {isAdmin && (
                <>
                  <FormTextArea
                    title="Admin notes"
                    value={adminNotes}
                    setValue={setAdminNotes}
                    disabled={isUpdatingAdminNotes}
                    rows={3}
                    className="mb-3"
                  />
                  <Button onClick={submitAdminNotes} isLoading={isUpdatingAdminNotes} className="mb-5">
                    Save
                  </Button>
                </>
              )}
            </>
          )}
          <FormRadio
            title="Type"
            options={contestTypes.map((ct) => contestTypeOptions.find((cto) => cto.value === ct)!)}
            selected={type}
            setSelected={changeType}
            disabled={mode !== "new" || type !== undefined}
          />
          {type === "wca-comp" && disabled && mode === "new" && (
            <>
              {/* Almost the same as the Competition ID element below */}
              <FormTextInput
                title="Competition ID"
                value={competitionId}
                setValue={setCompetitionId}
                tooltip="You can get the Competition ID from the end of the link of the WCA competition page"
                disabled={disabledIfDetailsImported || disabledIfContestApproved}
                className="mb-3"
              />
              <Button
                onClick={getWcaCompDetails}
                isLoading={isPendingWcaCompDetails}
                className="mb-3"
                disabled={disabledIfDetailsImported || !competitionId}
              >
                Get WCA competition details
              </Button>
            </>
          )}

          {!disabled && (
            <>
              <FormTextInput
                title="Contest name"
                value={name}
                setValue={changeName}
                autoFocus
                disabled={disabledIfDetailsImported || disabledIfContestPublished}
                className="mb-3"
              />
              <FormTextInput
                title="Short name"
                value={shortName}
                setValue={changeShortName}
                disabled={disabledIfDetailsImported || disabledIfContestPublished}
                tooltip="This is displayed in the contest list view and in other places where space is limited"
                className="mb-3"
              />
              {/* Almost the same as the Competition ID element above */}
              <FormTextInput
                title="Competition ID"
                value={competitionId}
                setValue={setCompetitionId}
                disabled={disabledIfDetailsImported || disabledIfContestApproved || (mode === "edit" && !isAdmin)}
                tooltip="Used in the URLs and for linking results and other data to the contest"
                className="mb-3"
              />
              {type !== "online" && (
                <>
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <FormTextInput
                        title="City"
                        value={city}
                        setValue={setCity}
                        disabled={disabledIfDetailsImported || disabledIfContestPublished}
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <FormRegionSelect
                        regionCode={regionCode}
                        setRegionCode={setRegionCode}
                        disabled={mode === "edit" || disabledIfDetailsImported}
                      />
                    </div>
                  </div>
                  <FormTextInput
                    title="Address"
                    value={address}
                    setValue={setAddress}
                    disabled={disabledIfDetailsImported || disabledIfContestPublished}
                    optional={!IS_CUBING_CONTESTS_INSTANCE}
                    className="mb-3"
                  />
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <FormTextInput
                        title="Venue"
                        value={venue}
                        setValue={setVenue}
                        disabled={disabledIfDetailsImported || disabledIfContestPublished}
                        optional={!IS_CUBING_CONTESTS_INSTANCE}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="row mb-3">
                        <div className="col-6">
                          <FormNumberInput
                            title="Latitude"
                            value={latitude}
                            setValue={(val) => changeCoordinates(val, longitude)}
                            disabled={disabledIfContestApproved || disabledIfDetailsImported}
                            min={-90}
                            max={90}
                          />
                        </div>
                        <div className="col-6">
                          <FormNumberInput
                            title="Longitude"
                            value={longitude}
                            setValue={(val) => changeCoordinates(latitude, val)}
                            disabled={disabledIfContestApproved || disabledIfDetailsImported}
                            min={-180}
                            max={180}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="fs-6 mb-2 text-secondary">
                          Time zone: {isPendingTimeZone ? <Loading small dontCenter /> : timezone}
                        </div>
                        <div className="fs-6 text-danger">
                          The coordinates must point to a building and match the address of the venue.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="row my-3">
                <div className="col">
                  {type === "meetup" ? (
                    <FormDatePicker
                      id="start_date"
                      title={`Start date and time (${isPendingTimeZone ? "..." : timezone})`}
                      value={startTime}
                      setValue={changeStartDate}
                      timezone={timezone}
                      disabled={disabledIfContestApproved}
                      dateFormat="Pp"
                      showUTCTime
                    />
                  ) : (
                    <FormDatePicker
                      id="start_date"
                      title="Start date"
                      value={startDate}
                      setValue={changeStartDate}
                      disabled={disabledIfContestApproved || disabledIfDetailsImported}
                    />
                  )}
                </div>
                {type !== "meetup" && (
                  <div className="col">
                    <FormDatePicker
                      id="end_date"
                      title="End date"
                      value={endDate}
                      setValue={changeEndDate}
                      disabled={disabledIfContestApproved || disabledIfDetailsImported}
                    />
                  </div>
                )}
              </div>
              <h5>
                Organizers <span className="text-muted tw:text-base">(select at least one)</span>
              </h5>
              <div className="my-3 rounded border bg-body-tertiary px-4 pt-3 pb-2">
                <FormPersonInputs
                  title="Organizer"
                  personNames={organizerNames}
                  setPersonNames={setOrganizerNames}
                  persons={organizers}
                  setPersons={setOrganizers}
                  infiniteInputs
                  nextFocusTargetId="contact"
                  disabled={(disabledIfContestApproved && !isAdmin) || disabledIfContestPublished}
                  addNewPersonMode="from-new-tab"
                  display="grid"
                />
              </div>
              <FormNumberInput
                title="Competitor limit"
                value={competitorLimit}
                setValue={setCompetitorLimit}
                disabled={
                  (disabledIfContestApproved && !isAdmin) || disabledIfDetailsImported || disabledIfContestPublished
                }
                integer
                min={C.minCompetitorLimit}
                optional={!IS_CUBING_CONTESTS_INSTANCE || !["comp", "wca-comp"].includes(type)}
                className="mb-3"
              />
              <FormTextInput
                id="contact"
                title="Contact"
                placeholder="john@example.com"
                value={contact}
                setValue={setContact}
                disabled={disabledIfContestPublished}
                optional
                className="mb-3"
              />
              <FormTextArea
                title="Description (Markdown supported)"
                value={description}
                setValue={setDescription}
                disabled={disabledIfContestPublished}
                rows={8}
                optional
                className="mb-3"
              />
              {type === "wca-comp" && (
                <div>
                  <p className="fs-6 fst-italic">
                    The following text will be displayed above the description on the contest page:
                  </p>
                  <div className="mx-2">
                    <WcaCompAdditionalDetails name={name || "CONTEST NAME"} competitionId={competitionId} />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "events" && (
        <ContestEvents
          events={events}
          rounds={rounds}
          setRounds={setRounds}
          totalResultsByRound={totalResultsByRound}
          competitionId={competitionId}
          contestType={type!}
          disabled={disabledIfContestPublished}
          newEventsDisabled={disabledIfContestApproved && !isAdmin}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === "schedule" && (
        <ScheduleEditor
          rooms={rooms}
          setRooms={setRooms}
          venueTimeZone={timezone}
          startDate={startDate!}
          contestType={type!}
          events={events}
          rounds={rounds}
          disabled={disabledIfContestPublished}
        />
      )}

      {!disabled && mode !== "edit" && (
        <>
          {type === "comp" && IS_CUBING_CONTESTS_INSTANCE && (
            <>
              <p className="fs-6 mt-4">
                This is an unofficial competition, which means that you must provide at least two photos of the setup
                (i.e. scrambling area, competition area, etc.) in the contest finished email thread after the
                competition, in accordance with rule U2.
              </p>
              <FormCheckbox
                id="comp_photos_understood"
                title="I understand"
                selected={isCompPhotosUnderstood}
                setSelected={setIsCompPhotosUnderstood}
              />
            </>
          )}
          {urgent && (
            <>
              <p className="fs-6 mt-4">
                You are submitting this contest within 7 days of the start date. In the future,{" "}
                <strong>please submit contests at least a week in advance</strong>.
              </p>
              <FormCheckbox
                id="timeliness_understood"
                title="I understand"
                selected={isTimelinessUnderstood}
                setSelected={setIsTimelinessUnderstood}
              />
            </>
          )}
        </>
      )}
    </Form>
  );
}

export default ContestForm;
